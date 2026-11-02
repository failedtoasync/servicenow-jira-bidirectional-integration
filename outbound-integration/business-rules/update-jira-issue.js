(function executeRule(current, previous /*null when async*/ ) {

    var jira = new JiraIncidentIntegration();

    var result = jira.updateJiraIssue(current);

    if (result.success) {

        current.work_notes =
            'Jira issue ' + result.jiraIssueKey +
            ' updated successfully from this incident.';

        current.update();

    } else {

        current.work_notes =
            'Jira issue update failed. ' +
            result.message +
            ' Please check the Jira integration configuration.';

        current.update();
    }



})(current, previous);
