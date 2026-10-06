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
assert settings.tracker.dispatch_states == ["Ready", "Progress"]
assert settings.tracker.active_states == ["Ready", "Progress"]
assert settings.tracker.review_state == "In Review"
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

for state <- ["Ready", "Progress"],
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

for attempt <- [nil, 2],
    description <- [nil, "Offline accepted contract"],
    native_ref <- [nil, issue.native_ref] do
  rendered =
    PromptBuilder.build_prompt(%{issue | description: description, native_ref: native_ref},
      attempt: attempt
    )

  assert String.contains?(rendered, issue.identifier)
  assert String.contains?(rendered, issue.id)
  if native_ref, do: assert(String.contains?(rendered, "SIGN-90000"))
  if description, do: assert(String.contains?(rendered, description))
  if attempt, do: assert(String.contains?(rendered, "follow-up attempt #2"))
end

assert Process.whereis(SymphonyElixir.Supervisor) == nil

IO.puts(
  "FE workflow: config, routing, dependency admission and 8 strict Liquid fixtures passed offline."
)
