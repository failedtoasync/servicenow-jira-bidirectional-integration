var JiraIncidentIntegration = Class.create();
JiraIncidentIntegration.prototype = {

    createJiraIssue: function(incident) {

        try {

            // Get ServiceNow Incident priority
            var incidentPriority = incident.getValue('priority');

            // Build Jira request body
            var requestBody = {
                fields: {
                    project: {
                        key: 'KAN'
                    },

                    summary: incident.getValue('short_description'),

                    issuetype: {
                        name: 'Task'
                    },

                    priority: {
                        id: incidentPriority
                    },

                    description: {
                        type: 'doc',
                        version: 1,
                        content: [{
                            type: 'paragraph',
                            content: [{
                                type: 'text',
                                text: 'ServiceNow Incident: ' +
                                    incident.getValue('number') +
                                    '\n\nDescription:\n' +
                                    incident.getValue('description')
                            }]
                        }]
                    }
                }
            };

            // Create REST request
            var request = new sn_ws.RESTMessageV2(
                'Jira Incident Integration',
                'Create Jira Issue'
            );

            request.setRequestBody(JSON.stringify(requestBody));

            var response = request.execute();

            var statusCode = response.getStatusCode();
            var responseBody = response.getBody();

            // Handle successful Jira creation
            if (statusCode == 201) {

                var result = JSON.parse(responseBody);

                if (result.key) {

                    gs.info(
                        'Jira issue ' + result.key +
                        ' created for Incident ' +
                        incident.getValue('number')
                    );

                    return {
                        success: true,
                        jiraIssueKey: result.key
                    };

                }

                gs.error(
                    'Jira issue was created but no issue key was returned. ' +
                    'Response: ' + responseBody
                );

                return {
                    success: false,
                    message: 'Jira issue key was not returned.'
                };
            }

            // Handle Jira HTTP errors
            gs.error(
                'Jira issue creation failed. HTTP status: ' +
                statusCode +
                '. Response: ' +
                responseBody
            );

            return {
                success: false,
                message: 'Jira returned HTTP status ' + statusCode
            };

        } catch (ex) {

            gs.error(
                'Jira integration error for Incident ' +
                incident.getValue('number') +
                ': ' + ex.message
            );

            return {
                success: false,
                message: 'Unexpected error while creating Jira issue.'
            };
        }
    },

	/*===========================================================
	=============================================================*/
	

    updateJiraIssue: function(incident) {

        try {

            // Get the existing Jira Issue Key
            var jiraIssueKey = incident.getValue(
                'x_1856934_servic_0_jira_issue_key'
            );

            if (gs.nil(jiraIssueKey)) {

                gs.error(
                    'Cannot update Jira issue because no Jira Issue Key exists for Incident ' +
                    incident.getValue('number')
                );

                return {
                    success: false,
                    message: 'Jira Issue Key is missing.'
                };
            }

            // Get ServiceNow Incident priority
            var incidentPriority = incident.getValue('priority');

            // Build Jira update request body
            var requestBody = {
                fields: {

                    summary: incident.getValue('short_description'),

                    priority: {
                        id: incidentPriority
                    },

                    description: {
                        type: 'doc',
                        version: 1,
                        content: [{
                            type: 'paragraph',
                            content: [{
                                type: 'text',
                                text: 'ServiceNow Incident: ' +
                                    incident.getValue('number') +
                                    '\n\nDescription:\n' +
                                    incident.getValue('description')
                            }]
                        }]
                    }
                }
            };

            // Create REST request
            var request = new sn_ws.RESTMessageV2(
                'Jira Incident Integration',
                'Update Jira Issue'
            );

            // Set Jira issue in the endpoint
            request.setStringParameterNoEscape(
                'issueIdOrKey',
                jiraIssueKey
            );

            request.setRequestBody(JSON.stringify(requestBody));

            var response = request.execute();

            var statusCode = response.getStatusCode();
            var responseBody = response.getBody();

            // Jira successful update normally returns HTTP 204
            if (statusCode == 204) {

                gs.info(
                    'Jira issue ' + jiraIssueKey +
                    ' updated for Incident ' +
                    incident.getValue('number')
                );

                return {
                    success: true,
                    jiraIssueKey: jiraIssueKey
                };
            }

            // Handle Jira HTTP errors
            gs.error(
                'Jira issue update failed for ' +
                jiraIssueKey +
                '. HTTP status: ' +
                statusCode +
                '. Response: ' +
                responseBody
            );

            return {
                success: false,
                message: 'Jira returned HTTP status ' + statusCode
            };

        } catch (ex) {

            gs.error(
                'Jira integration update error for Incident ' +
                incident.getValue('number') +
                ': ' + ex.message
            );

            return {
                success: false,
                message: 'Unexpected error while updating Jira issue.'
            };
        }
    },

    type: 'JiraIncidentIntegration'
};
