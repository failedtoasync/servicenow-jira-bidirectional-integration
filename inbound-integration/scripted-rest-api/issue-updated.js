(function process( /*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    // implement resource here



    // 1. Get the raw webhook body
    var rawBody = request.body.dataString;

    // 2. Get Jira's HMAC signature
    var jiraSignature = request.getHeader('X-Hub-Signature');

    if (!jiraSignature) {

        response.setStatus(401);

        response.setBody({
            status: "error",
            message: "Missing X-Hub-Signature"
        });

        return;
    }

    // 3. Get the shared secret from the system property
    var secret = gs.getProperty(
        'x_1856934_servic_0.jira.integration.webhook.secret'
    );

    if (!secret) {

        response.setStatus(500);

        response.setBody({
            status: "error",
            message: "HMAC secret is not configured"
        });

        return;
    }

    // 4. Validate the signature format
    var parts = jiraSignature.split('=');

    if (parts.length != 2 || parts[0] != 'sha256') {

        response.setStatus(401);

        response.setBody({
            status: "error",
            message: "Invalid X-Hub-Signature format"
        });

        return;
    }

    var jiraHexSignature = parts[1];

    // 5. Generate HMAC using the ServiceNow secret

    var encodedSecret = gs.base64Encode(secret);

    var mac = new CertificateEncryption();

    var calculatedBase64Signature = mac.generateMac(
        encodedSecret,
        'HmacSHA256',
        rawBody
    );

    /*var encodedSecret = GlideStringUtil.base64Encode(secret);

    var mac = new CertificateEncryption();

    var calculatedBase64Signature = mac.generateMac(
        encodedSecret,
        'HmacSHA256',
        rawBody
    );*/

    // 6. Convert Jira hexadecimal signature to Base64
    var jiraBase64Signature = hexToBase64(jiraHexSignature);

    // 7. Compare signatures
    if (calculatedBase64Signature != jiraBase64Signature) {

        gs.warn("Jira webhook HMAC validation failed.");

        response.setStatus(401);

        response.setBody({
            status: "error",
            message: "Invalid HMAC signature"
        });

        return;
    }

    // =====================================================
    // HMAC VALIDATION SUCCESSFUL
    // =====================================================

    gs.info("Jira webhook HMAC validation successful.");

    // 8. Parse the webhook body
    var body;

    try {

        body = JSON.parse(rawBody);

    } catch (e) {

        gs.warn("Invalid Jira webhook JSON payload.");

        response.setStatus(400);

        response.setBody({
            status: "error",
            message: "Invalid JSON payload"
        });

        return;
    }

    // 9. Get Jira information
    var issueKey = body.issue.key;
    var jiraStatus = body.issue.fields.status.name;

    if (!issueKey || !jiraStatus) {

        response.setStatus(400);

        response.setBody({
            status: "error",
            message: "Jira issue key or status is missing"
        });

        return;
    }

    gs.info("Jira Issue Key: " + issueKey);
    gs.info("Jira Status: " + jiraStatus);

    // =====================================================
    // FIND THE SERVICE NOW INCIDENT
    // =====================================================

    var incident = new GlideRecord('incident');

    incident.addQuery('x_1856934_servic_0_jira_issue_key', issueKey);
    incident.query();

    if (!incident.next()) {

        gs.warn(
            "No Incident found for Jira Issue Key: " +
            issueKey
        );

        response.setStatus(404);

        response.setBody({
            status: "error",
            message: "No Incident found",
            x_1856934_servic_0_jira_issue_key: issueKey
        });

        return;
    }

    // =====================================================
    // JIRA STATUS → SERVICE NOW STATE
    // =====================================================

    var stateMap = {
        "To Do": "1",
        "In Progress": "2",
        "In Review": "2"
    };

    /*
     * Jira Done is intentionally not mapped to ServiceNow
     * Resolved. Completion of the development task does not
     * necessarily mean the original Incident is resolved.
     */

    if (stateMap[jiraStatus]) {

        incident.setValue(
            'state',
            stateMap[jiraStatus]
        );

        incident.update();

        gs.info(
            "Incident " +
            incident.number +
            " state updated from Jira status: " +
            jiraStatus
        );

    } else {

        gs.info(
            "No ServiceNow state mapping configured for Jira status: " +
            jiraStatus
        );
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    response.setStatus(200);

    response.setBody({
        status: "success",
        message: "Jira status processed successfully",
        incident_number: incident.number,
        jira_issue_key: issueKey,
        jira_status: jiraStatus
    });


    // =====================================================
    // HEX → BASE64 CONVERSION
    // =====================================================

    function hexToBase64(str) {

        var table =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        var bytes = [];

        for (var i = 0; i < str.length; i += 2) {

            bytes.push(
                parseInt(str.substr(i, 2), 16)
            );
        }

        var result = '';

        for (var j = 0; j < bytes.length; j += 3) {

            var a = bytes[j];
            var b = (j + 1 < bytes.length) ? bytes[j + 1] : 0;
            var c = (j + 2 < bytes.length) ? bytes[j + 2] : 0;

            result += table.charAt(a >> 2);

            result += table.charAt(
                ((a & 3) << 4) | (b >> 4)
            );

            if (j + 1 < bytes.length) {

                result += table.charAt(
                    ((b & 15) << 2) | (c >> 6)
                );

            } else {

                result += '=';
            }

            if (j + 2 < bytes.length) {

                result += table.charAt(c & 63);

            } else {

                result += '=';
            }
        }

        return result;
    }



})(request, response);
