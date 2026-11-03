# Testing Overview

This section documents the testing performed on the ServiceNow–Jira integration to verify that the implemented components and workflows work as expected. It covers the verification of both outbound and inbound workflows, including issue creation, updates, and status synchronization between ServiceNow and Jira. The following sections describe the tested scenarios, their results, and supporting screenshots.

## 1. Jira Issue Creation

Both Jira issue creation paths were tested successfully. Automatic creation for Software P1 Critical and P2 High Incidents through the `Create Jira Issue - High Priority` Business Rule, and manual creation for P3 Moderate and P4 Low Incidents through the `Create Jira Issue` UI Action, worked as expected.

Both paths used the `JiraIncidentIntegration` Script Include and `Create Jira Issue` REST method with the configured Basic Authentication Profile. Jira issues were created successfully in the **My SP Team (KAN)** project, and the returned Jira Issue Keys were saved to the corresponding Incidents.

## 2. Jira Issue Updates

Synchronization of Incident changes with existing Jira issues was tested successfully. Changes to the Incident's **Short Description, Description, and Priority** were sent to the linked Jira issue through the `Update Jira Issue` Business Rule.

The Business Rule used `JiraIncidentIntegration.updateJiraIssue()` and the `Update Jira Issue` REST method to update the corresponding Jira issue using its saved Jira Issue Key. The updated values were reflected in Jira as expected.


## 3. Jira Webhook Processing

Incoming Jira issue-update webhooks were tested successfully. The `Jira Incident Webhook API` and its `Issue Updated` REST resource received and processed webhook requests from Jira Cloud. HMAC-SHA256 signature validation using the shared secret stored in the Password 2 system property worked as expected.

The resource successfully extracted the Jira Issue Key and status from the payload and located the corresponding ServiceNow Incident using the Jira Issue Key field.

## 4. Incident Status Synchronization

Jira-to-ServiceNow status synchronization was tested successfully. The supported mappings worked as expected: **To Do** updated the Incident to **New**, while **In Progress** and **In Review** updated it to **In Progress**. Jira **Done** remains unmapped and does not automatically resolve the ServiceNow Incident, keeping the two systems' completion lifecycles independent.


## 5. Testing Evidence

The following screenshots provide supporting evidence for the outbound and inbound integration tests, demonstrating the execution results and expected updates across ServiceNow and Jira.
