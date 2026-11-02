(function executeRule(current, previous /*null when async*/ ) {

    var jira = new JiraIncidentIntegration();

    var result = jira.createJiraIssue(current);

    if (result.success) {

        current.setValue(
            'x_1856934_servic_0_jira_issue_key',
            result.jiraIssueKey
        );

        current.work_notes =
            'Jira issue ' + result.jiraIssueKey +
            ' created successfully and linked to this incident.';

        current.update();

    } else {

        current.work_notes =
            'Jira issue creation failed. ' +
            result.message + 
            ' Please check the Jira integration configuration.';

        current.update();
    }


})(current, previous);
