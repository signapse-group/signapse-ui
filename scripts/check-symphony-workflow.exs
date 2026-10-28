import ExUnit.Assertions

alias SymphonyElixir.{Config, PromptBuilder, Workflow}
alias SymphonyElixir.Config.Schema
alias SymphonyElixir.Jira.Client
alias SymphonyElixir.Tracker.Issue

# Run from the Symphony Elixir project with mix run --no-start and a workflow path.
assert Process.whereis(SymphonyElixir.Supervisor) == nil
[workflow_path] = System.argv()

System.put_env(%{
  "JIRA_BASE_URL" => "https://jira.invalid",
  "JIRA_EMAIL" => "fixture@example.invalid",
  "JIRA_API_TOKEN" => "offline-fixture",
  "SYMPHONY_WORKSPACE_ROOT" => Path.join(System.tmp_dir!(), "ui-workflow-offline")
})

Application.put_env(:symphony_elixir, :workflow_file_path, Path.expand(workflow_path))
{:ok, workflow} = Workflow.load(workflow_path)
{:ok, settings} = Schema.parse(workflow.config)
assert :ok == Config.validate_settings(settings)
assert settings.tracker.kind == "jira"
assert settings.tracker.provider["project_key"] == "SIGN"
assert settings.tracker.provider["issue_types"] == ["Subtask"]

assert Enum.sort(settings.tracker.provider["routing_labels"]) ==
         Enum.sort(
           ~w(route-backend route-frontend route-quality-assurance route-mdg route-landing)
         )

assert settings.tracker.required_labels == ["route-frontend"]
assert settings.tracker.dispatch_states == ["Ready", "Progress", "In Review"]
assert settings.tracker.active_states == ["Ready", "Progress", "In Review"]
assert settings.tracker.review_state == "In Review"
assert settings.tracker.session_boundary_states == ["Ready"]
assert settings.tracker.terminal_states == ["Done"]

assert String.contains?(
         settings.hooks.after_create,
         "https://github.com/signapse-group/signapse-ui.git"
       )

raw = %{
  "id" => "90001",
  "key" => "SIGN-90001",
  "fields" => %{
    "summary" => "FE: Offline workflow fixture",
    "project" => %{"key" => "SIGN"},
    "issuetype" => %{"id" => "10002", "name" => "Subtask", "subtask" => true},
    "parent" => %{"id" => "90000", "key" => "SIGN-90000"},
    "labels" => ["route-frontend", "fixture"],
    "status" => %{"name" => "Ready", "statusCategory" => %{"key" => "new"}},
    "issuelinks" => []
  }
}

issue = Client.normalize_issue_for_test(raw, settings.tracker)
assert Issue.routable?(issue, settings.tracker.required_labels)
assert issue.admission_ready

excluded = [
  put_in(raw, ["fields", "issuetype"], %{"id" => "10003", "name" => "Task", "subtask" => false}),
  update_in(raw, ["fields"], &Map.delete(&1, "parent")),
  put_in(raw, ["fields", "labels"], []),
  put_in(raw, ["fields", "labels"], ["route-backend"]),
  put_in(raw, ["fields", "labels"], ["route-frontend", "route-backend"])
]

for candidate <- excluded do
  normalized = Client.normalize_issue_for_test(candidate, settings.tracker)
  refute Issue.routable?(normalized, settings.tracker.required_labels)
end

assert Client.normalize_issue_for_test(
         put_in(raw, ["fields", "project", "key"], "OTHER"),
         settings.tracker
       ) == nil

for state <- ["Ready", "Progress", "In Review"],
    {status, category, expected} <-
      [{"Closed", "done", true}, {"Resolved", "indeterminate", false}, {"Unknown", nil, false}] do
  blocker = %{
    "id" => "90002",
    "key" => "SIGN-90002",
    "fields" => %{"status" => %{"name" => status, "statusCategory" => %{"key" => category}}}
  }

  linked =
    raw
    |> put_in(["fields", "status", "name"], state)
    |> put_in(["fields", "issuelinks"], [
      %{"type" => %{"name" => "Blocks"}, "inwardIssue" => blocker}
    ])

  assert Client.normalize_issue_for_test(linked, settings.tracker).admission_ready == expected
end

refute Client.normalize_issue_for_test(
         put_in(raw, ["fields", "issuelinks"], nil),
         settings.tracker
       ).admission_ready

runbooks = %{
  "Survey" => "docs/runbooks/survey.md",
  "Implement" => "docs/runbooks/implement.md",
  "Review" => "docs/runbooks/review-and-delivery.md"
}

for path <- Map.values(runbooks) do
  assert File.regular?(Path.join(Path.dirname(Path.expand(workflow_path)), path))
end

fixtures =
  for state <- ["Ready", "Progress", "In Review", "Open", "Blocked", "Done"],
      attempt <- [nil, 2],
      description <- [nil, "", "Offline accepted contract"],
      native_ref <- [nil, %{issue_type: nil, parent: nil}, issue.native_ref] do
    candidate = %{issue | state: state, description: description, native_ref: native_ref}
    rendered = PromptBuilder.build_prompt(candidate, attempt: attempt)
    assert String.contains?(rendered, issue.identifier)
    assert String.contains?(rendered, issue.id)
    if native_ref && native_ref.parent, do: assert(String.contains?(rendered, "SIGN-90000"))
    if description && description != "", do: assert(String.contains?(rendered, description))
    if attempt, do: assert(String.contains?(rendered, "Follow-up attempt #2"))

    phase = %{"Ready" => "Survey", "Progress" => "Implement", "In Review" => "Review"}[state] || "Stop"
    assert String.contains?(rendered, "## Phase: #{phase}")
    for other <- ["Survey", "Implement", "Review", "Stop"] -- [phase] do
      refute String.contains?(rendered, "## Phase: #{other}")
    end

    for {name, path} <- runbooks do
      assert String.contains?(rendered, "](#{path})") == (phase == name)
    end
    refute String.contains?(rendered, "Grant:")
    refute Regex.match?(~r/\$(implement|code-review|agent-execution-policy)\b/, rendered)
    refute String.contains?(rendered, "execution-policy.md")
    refute String.contains?(rendered, "docs/delivery.md")
    if phase == "Stop", do: assert(String.contains?(rendered, "Stop autonomous work"))
    phase
  end

assert String.contains?(settings.hooks.before_run, "refs/heads/main:refs/remotes/origin/main")
assert String.contains?(workflow.prompt_template, "git show origin/main:<path>")
root = Path.dirname(Path.expand(workflow_path))
for path <- ["AGENTS.md", "components/AGENTS.override.md"] ++ Map.values(runbooks) do
  source = File.read!(Path.join(root, path))
  refute String.contains?(source, "signapse-planing/blob/main/workflow/project-execution-workflow.md#ui-design-gate")
  refute String.contains?(source, "signapse-planing/blob/main/ui-design/references/DESIGN.md#responsive-contract")
end
design = File.read!(Path.join(root, "docs/design/DESIGN.md"))
for rule <- ["## UI Design Gate", "## Responsive Contract", "390×844", "1024×768", "1520×1024", "767/768px", "1439/1440px", "200%"] do
  assert String.contains?(design, rule)
end

assert length(fixtures) == 108

for {state, phase} <- [
      {" ready ", "Survey"},
      {" PROGRESS ", "Implement"},
      {" in REVIEW ", "Review"},
      {"Waiting", "Stop"},
      {"", "Stop"}
    ] do
  rendered = PromptBuilder.build_prompt(%{issue | state: state})
  assert String.contains?(rendered, "## Phase: #{phase}")
  for {name, path} <- runbooks do
    assert String.contains?(rendered, "](#{path})") == (phase == name)
  end
end

assert Process.whereis(SymphonyElixir.Supervisor) == nil
IO.puts("Consumer workflow: config/routing/dependency admission, 108 strict runbook-selection fixtures and 5 normalized/unsupported states passed offline.")
