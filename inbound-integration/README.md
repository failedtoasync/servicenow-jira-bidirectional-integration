## Workflow Overview

The inbound integration connects Jira Cloud with ServiceNow by receiving webhook notifications when Jira issues are updated. It allows supported Jira status changes to be reflected in the corresponding ServiceNow Incident without requiring the Service Desk to manually track those changes in both systems.

The integration focuses on synchronizing selected status changes while keeping ServiceNow as the primary system for Incident management and resolution.

## Table of Contents

- [Scripted REST API](#scripted-rest-api)
- [REST Resource](#rest-resource)
- [HMAC Shared Secret System Property](#hmac-shared-secret-system-property)
- [Jira Cloud Webhook](#jira-cloud-webhook)
- [Jira Issue Key Field](#jira-issue-key-field)
- [Inbound Testing](#inbound-testing)

## Scripted REST API

A Scripted REST API named **Jira Incident Webhook API** was created to provide an endpoint for incoming Jira webhook requests.

The API uses the ID `jira_incident_webhook` within the application namespace. It exposes the resource that Jira Cloud calls when an issue is updated.

## REST Resource

The **Issue Updated** resource handles incoming POST requests from Jira Cloud. Its server-side script first validates the request using HMAC-SHA256 and the shared secret. Once validated, it parses the payload, extracts the Jira Issue Key and status, and locates the corresponding ServiceNow Incident using the Jira Issue Key field.

The resource then applies the supported status mapping and updates the Incident. **To Do** maps to **New**, while **In Progress** and **In Review** map to **In Progress**. Jira **Done** does not automatically resolve the Incident, as completion of a Jira issue and resolution of a ServiceNow Incident follow separate lifecycles. The ServiceNow Incident follows its own resolution process, independent of the Jira issue's completion.

Invalid requests and unmatched Incidents are handled with appropriate error responses, while unsupported statuses are acknowledged without changing the Incident state.

The implementation is available in [`scripted-rest-api/issue-updated.js`](scripted-rest-api/issue-updated.js).

## HMAC Shared Secret System Property

A **Password 2** system property stores the shared secret used for validating incoming Jira webhook requests. The secret is configured to match the value used by the Jira Cloud webhook and is retrieved by the REST resource during signature validation.

## Jira Cloud Webhook

A Jira Cloud webhook named **ServiceNow Incident Integration** was configured to send issue-update notifications to the ServiceNow endpoint.

The webhook listens for the **Issue Updated** event and uses the JQL condition `project = "My SP Team"` to limit notifications to the integration's Jira project. The request body is included so ServiceNow can access the issue information required by the integration.

## Jira Issue Key Field

The inbound integration uses the existing **Jira Issue Key** field on the ServiceNow Incident table to correlate incoming Jira updates with their original Incidents.

The field stores the Jira issue key returned during outbound issue creation. The inbound resource uses this same value to identify the Incident associated with an incoming Jira issue update.

The field is shared by both integration directions and is documented in the [Outbound Integration README](../outbound-integration/README.md#jira-issue-key-field).

## Inbound Testing

Inbound testing covered receiving Jira issue-update webhooks, validating HMAC signatures, identifying the corresponding ServiceNow Incidents using Jira Issue Keys, and synchronizing supported Jira status changes with the Incident State.

See [Testing](../testing/README.md).


