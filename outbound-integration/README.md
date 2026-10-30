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
4. [Execution, Error Handling, and Validation Summary](#execution-error-handling-and-validation-summary)
5. [Folder Index](#folder-index)

## Jira Prerequisites

The integration uses a Jira Cloud project named **My SP Team**, with the project key `KAN` and the issue type `Task` as the destination for ServiceNow Incident-related issues. Communication with Jira is performed using Jira Cloud REST API v3. Basic Authentication is configured in ServiceNow using the Jira account email address and an API token generated from the Jira account. These credentials are stored in the ServiceNow Basic Auth Profile `Jira Outbound Credentials`.

### Jira Issue Key Field

A custom String field named **Jira Issue Key** (column name: `x_1856934_servic_0_jira_issue_key`, maximum length: 40) was added to the Incident (`incident`) table. It stores the key returned by Jira after successful issue creation, establishing a link between the ServiceNow Incident and its corresponding Jira issue. When the Incident's Short Description, Description, or Priority changes, the **Update Jira Issue** Business Rule uses this stored key to identify and update the corresponding Jira issue, ensuring that updates are applied to the existing issue rather than creating a duplicate.

### Business Rules

Two Business Rules handle automatic Jira issue creation and synchronization of existing Jira issues with ServiceNow Incidents.

- **Create Jira Issue - High Priority:** Automatically creates a Jira issue when a qualifying Software Incident with Critical (P1) or High (P2) priority is inserted or updated and does not already have a Jira Issue Key. It stores the returned key on the Incident after successful creation.

  [View Business Rule Documentation](business-rules/create-jira-issue-high-priority.md)

- **Update Jira Issue:** Updates the existing Jira issue when the Short Description, Description, or Priority of a linked Software Incident changes. It uses the stored Jira Issue Key to identify the corresponding issue.

  [View Business Rule Documentation](business-rules/update-jira-issue.md)

### UI Action

The **Create Jira Issue** UI Action provides a manual option to create Jira issues for qualifying Software Incidents with Moderate (P3) or Low (P4) priority. It appears as a form button when the Incident meets the configured conditions and does not already have a Jira Issue Key. The UI Action calls the shared `JiraIncidentIntegration` Script Include to create the Jira issue, stores the returned Jira Issue Key on the Incident after successful creation, and records success or failure feedback in the Incident work notes.

[View UI Action Documentation](ui-actions/create-jira-issue.md)


### Script Include

The `JiraIncidentIntegration` Script Include contains the shared logic for communicating with Jira Cloud. It provides two methods: `createJiraIssue(incident)` to create a Jira issue from a ServiceNow Incident, and `updateJiraIssue(incident)` to synchronize selected Incident field changes with an existing Jira issue. Both the **Create Jira Issue - High Priority** Business Rule and the **Create Jira Issue** UI Action use the creation method, while the **Update Jira Issue** Business Rule uses the update method. The Script Include handles REST request execution, response processing, and error reporting, keeping the integration logic centralized rather than duplicated across the calling components.

[View Script Include Documentation](script-include/README.md)

