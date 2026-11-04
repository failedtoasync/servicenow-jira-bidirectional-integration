# Workflow Overview

The outbound integration connects ServiceNow Incidents with Jira Cloud by creating Jira issues for qualifying Software Incidents and synchronizing selected Incident field changes with their linked Jira issues. P1 Critical and P2 High Software Incidents are processed automatically through a Business Rule, while P3 Moderate and P4 Low Software Incidents support manual issue creation through a UI Action. Both creation paths use shared integration logic, and the Jira Issue Key is stored on the ServiceNow Incident to maintain the relationship between the records.

## Table of Contents

1. [Jira Prerequisites](#jira-prerequisites)
2. [Components](#components)
   - [Jira Issue Key Field](#jira-issue-key-field)
   - [Business Rules](#business-rules)
   - [UI Action](#ui-action)
   - [Script Include](#script-include)
   - [REST Message and Methods](#rest-message-and-methods)
3. [Outbound Data Mapping](#outbound-data-mapping)
   - [Incident to Jira Field Mapping](#incident-to-jira-field-mapping)
   - [Priority Mapping](#priority-mapping)
4. [Outbound Testing](#outbound-testing)
5. [Folder Index](#folder-index)

## Jira Prerequisites

The integration uses a Jira Cloud project named **My SP Team**, with the project key `KAN` and the issue type `Task` as the destination for ServiceNow Incident-related issues. Communication with Jira is performed using Jira Cloud REST API v3. Basic Authentication is configured in ServiceNow using the Jira account email address and an API token generated from the Jira account. These credentials are stored in the ServiceNow Basic Auth Profile `Jira Outbound Credentials`.

## Components

### Jira Issue Key Field

A custom String field named **Jira Issue Key** (column name: `x_1856934_servic_0_jira_issue_key`, maximum length: 40) was added to the Incident (`incident`) table. It stores the key returned by Jira after successful issue creation, establishing a link between the ServiceNow Incident and its corresponding Jira issue. When the Incident's Short Description, Description, or Priority changes, the **Update Jira Issue** Business Rule uses this stored key to identify and update the corresponding Jira issue, ensuring that updates are applied to the existing issue rather than creating a duplicate.

### Business Rules

Two Business Rules handle automatic Jira issue creation and synchronization of existing Jira issues with ServiceNow Incidents.

**Create Jira Issue - High Priority:**

Automatically creates a Jira issue when a qualifying Software Incident with Critical (P1) or High (P2) priority is inserted or updated and does not already have a Jira Issue Key. It stores the returned key on the Incident after successful creation.

**Update Jira Issue:**

Updates the existing Jira issue when the Short Description, Description, or Priority of a linked Software Incident changes. It uses the stored Jira Issue Key to identify the corresponding issue.

**View Business Rule Scripts:**

- [Create Jira Issue - High Priority](business-rules/create-jira-issue-high-priority.js)
- [Update Jira Issue](business-rules/update-jira-issue.js)


### UI Action

The **Create Jira Issue** UI Action provides a manual option to create Jira issues for qualifying Software Incidents with Moderate (P3) or Low (P4) priority. It appears as a form button when the Incident meets the configured conditions and does not already have a Jira Issue Key. The UI Action calls the shared `JiraIncidentIntegration` Script Include to create the Jira issue, stores the returned Jira Issue Key on the Incident after successful creation, and records success or failure feedback in the Incident work notes.

**View UI Action Script:**

[Create Jira Issue](ui-action/create-jira-issue.js)


### Script Include

The `JiraIncidentIntegration` Script Include (`x_1856934_servic_0.JiraIncidentIntegration`) centralizes the outbound REST integration logic between ServiceNow and Jira Cloud. It provides two methods, `createJiraIssue(incident)` and `updateJiraIssue(incident)`, which receive the current Incident record, build the corresponding JSON request payload, and execute REST operations using `sn_ws.RESTMessageV2`.

**Create Jira Issue — `createJiraIssue(incident)`**

This method reads the Incident's Short Description, Description, Priority, and Incident Number to build the Jira issue creation payload. It sets the destination project to `KAN`, the issue type to `Task`, and maps the Incident priority to the Jira Priority ID. The description is formatted as an Atlassian Document Format (ADF) document containing the ServiceNow Incident number and description.

The method invokes the **Create Jira Issue** method of the `Jira Incident Integration` REST Message, sets the generated JSON payload as the request body, and executes the POST request. It expects HTTP `201` and checks the response for the Jira Issue Key. If the key is returned, it logs successful creation and returns the key to the calling component. Missing keys, unsuccessful HTTP responses, and unexpected exceptions are handled as failures, with error details logged and an appropriate failure message returned.

**Update Jira Issue — `updateJiraIssue(incident)`**

This method first retrieves the stored Jira Issue Key from the Incident field `x_1856934_servic_0_jira_issue_key`. If the key is missing, it logs an error and returns a failure result without executing a REST request.

For an existing linked issue, it builds an update payload using the Incident's Short Description, Description, and Priority. The description uses the same ADF structure as the creation request. The method invokes the **Update Jira Issue** method of the `Jira Incident Integration` REST Message, passes the stored Jira Issue Key to the `issueIdOrKey` endpoint variable using `setStringParameterNoEscape()`, and executes the PUT request.

An HTTP `204` response indicates a successful update. The method logs the result and returns the Jira Issue Key to the calling component. Unsuccessful HTTP responses and unexpected exceptions are logged and returned as failure results.

Both methods use `try/catch` error handling and return structured results to their calling components. The Business Rules and UI Action use these results to store the Jira Issue Key where applicable and record execution feedback in the Incident work notes.

**View UI Action Script:**

[Create Jira Issue](ui-action/create-jira-issue.js)


### REST Message and Methods

The `Jira Incident Integration` REST Message defines the outbound API operations used by ServiceNow to communicate with Jira Cloud. It uses **Jira Cloud REST API v3** and provides separate methods for creating and updating Jira issues.

**Authentication**

The REST Message uses **Basic Authentication** to authenticate requests with Jira Cloud. The authentication credentials consist of the Jira account email address and an API token generated from that account. They are configured in a ServiceNow Basic Auth Profile and are not exposed in the integration scripts or stored in this repository.

**REST Methods**

The REST Message contains two methods:

**Create Jira Issue**

- **HTTP Method:** POST
- **API Endpoint:** `/rest/api/3/issue`
- **Purpose:** Sends a request to Jira Cloud to create a new issue using the Incident details prepared by the integration.

**Update Jira Issue**

- **HTTP Method:** PUT
- **API Endpoint:** `/rest/api/3/issue/${issueIdOrKey}`
- **Purpose:** Sends a request to update an existing Jira issue. The `issueIdOrKey` endpoint variable identifies the Jira issue to be updated.

Both methods are executed through `sn_ws.RESTMessageV2` in the `JiraIncidentIntegration` Script Include. The Script Include prepares the request payload, invokes the appropriate REST method, and handles the response returned by Jira.

**View REST Message Configuration:**

[REST Message and Methods](rest-message/README.md)

## Outbound Data Mapping

The integration maps selected ServiceNow Incident fields to Jira issue fields during creation and subsequent updates.

### Incident to Jira Field Mapping

| ServiceNow Incident field | Jira issue field | Mapping behavior |
|---|---|---|
| Short Description | Summary | Mapped directly to the Jira issue summary. |
| Number and Description | Description | Combined into one ADF-formatted description, with the Incident number followed by the Incident description. |
| Priority | Priority | Translated to the corresponding Jira priority. |

The Jira project is fixed to **KAN**, and the issue type is fixed to **Task** for all issues created by this integration.

### Priority Mapping

| ServiceNow Incident priority | Jira priority |
|---|---|
| Critical (P1) | Highest |
| High (P2) | High |
| Moderate (P3) | Medium |
| Low (P4) | Low |
| Planning (P5) | Lowest |

During subsequent updates, changes to **Short Description**, **Description**, and **Priority** are synchronized with the existing linked Jira issue.

## Outbound Testing

Outbound testing covered automatic Jira issue creation for qualifying P1 Critical and P2 High Software Incidents, manual issue creation for P3 Moderate and P4 Low Software Incidents, and synchronization of changes to the Short Description, Description, and Priority of existing linked Jira issues.

See [Testing](../testing/README.md).

## Folder Index

- [Business Rules](business-rules/)
- [Script Include](script-include/)
- [UI Action](ui-action/)
