# snow-change-request-action

A GitHub Action for working with ServiceNow change requests.

## Usage

There are some inputs that are required for all available actions:

| Input                | Description                                                                                                                                                         |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `action`             | Determines what step in the action lifecycle to take. Must be of one `attach-file`, `create`, `approve`, `lookup-change-request`, `require-approval`, `transition`  |
| `githubToken`        | A GitHub access token with the `public_repo` scope, or the default `${{ secrets.GITHUB_TOKEN }}`. Used to post pull request comments and make read-only API calls.  |
| `serviceNowUrl`      | URL of the ServiceNow instance.                                                                                                                                     |
| `serviceNowUsername` | ServiceNow username, must have necessary permissions to create and update change requests.                                                                          |
| `serviceNowPassword` | Corresponding password for `servicenowUsername`.                                                                                                                    |

### Create a Change Request

#### Inputs

| Input                     | Description                                                | Default      |
|---------------------------|------------------------------------------------------------|--------------|
| `approvalAssignmentGroup` | Name of the group that needs to approve the change request | CAB Approval |
| `changeRequestMessage`    | This will be set as the change request description.        | N/A          |

#### Outputs

| Output   | Description                      |
|----------|----------------------------------|
| `sysId`  | Sysid of the new change request  |
| `number` | Number of the new change request |

#### Example

```yaml
 - name: Create Change Request
    uses: liatrio/snow-change-request-action@v0.1.0
    id: cr
    with:
      action: create
      changeRequestMessage: "Deploy demo-app"
      githubToken: ${{ secrets.GITHUB_TOKEN }}
      serviceNowUrl: ${{ env.SNOW_URL }}
      serviceNowUsername: ${{ env.SNOW_USERNAME }}
      serviceNowPassword: ${{ secrets.SNOW_PASSWORD }}
```

### Upload an Attachment to a Change Request

#### Inputs

| Input                       | Description                                                                                | Default            |
|-----------------------------|--------------------------------------------------------------------------------------------|--------------------|
| `attachmentFilePath`        | Path to the file, including the file name                                                  | N/A                |
| `attachmentFileName`        | Name the attachment should have in ServiceNow, does not need to match `attachmentFilePath` | N/A                |
| `attachmentFileContentType` | Content type of the file to attach                                                         | `application/text` |
| `requestSysId`              | Sysid of the change request                                                                | N/A                |

#### Example

```yaml
  - name: Add attachment
    uses: liatrio/snow-change-request-action@v0.1.0
    with:
      action: attach-file
      attachmentFilePath: ${{ steps.report.outputs.reportPath }}
      attachmentFileName: report.md
      requestSysId: ${{ steps.cr.outputs.sysId }}
      serviceNowUrl: ${{ env.SNOW_URL }}
      serviceNowUsername: ${{ env.SNOW_USERNAME }}
      serviceNowPassword: ${{ secrets.SNOW_PASSWORD }}
```

### Approve a Change Request

Approves a change request on behalf of the assignment group and CAB. 

#### Inputs

| Input          | Description                 | Default |
|----------------|-----------------------------|---------|
| `requestSysId` | Sysid of the change request | N/A     |

#### Example

```yaml
  - name: Approve Change Request
    uses: liatrio/snow-change-request-action@v0.1.0
    with:
      action: approve
      githubToken: ${{ secrets.GITHUB_TOKEN }}
      requestSysId: ${{ steps.cr.outputs.sysId }}
      serviceNowUrl: ${{ env.SNOW_URL }}
      serviceNowUsername: ${{ env.SNOW_USERNAME }}
      serviceNowPassword: ${{ secrets.SNOW_PASSWORD }}
```

### Require an Approved Change Request

Adds a check that the change request has been approved and that the current time is in the change window. 
If no change window is provided on the request, the action will fail.

#### Inputs

| Input          | Description                 | Default |
|----------------|-----------------------------|---------|
| `requestSysId` | Sysid of the change request | N/A     |

#### Example

```yaml
  - name: Require Change Request Approval
    uses: liatrio/snow-change-request-action@v0.1.0
    with:
      action: require-approval
      requestSysId: ${{ needs.evaluate.outputs.requestSysId }}
      serviceNowUrl: ${{ env.SNOW_URL }}
      serviceNowUsername: ${{ env.SNOW_USERNAME }}
      serviceNowPassword: ${{ secrets.SNOW_PASSWORD }}
```

### Transition the State of a Change Request

Move a change request between states. If there are multiple states to transition, separate them with a pipe (`|`).

#### Inputs

| Input          | Description                     | Default |
|----------------|---------------------------------|---------|
| `requestSysId` | Sysid of the change request     | N/A     |
| `transition`   | New state of the change request | N/A     |

#### Example

```yaml
  - name: Close Change Request
    uses: liatrio/snow-change-request-action@v0.1.0
    with:
      action: transition
      requestSysId: ${{ steps.cr.outputs.sysId }}
      transition: 'review|closed'
      serviceNowUrl: ${{ env.SNOW_URL }}
      serviceNowUsername: ${{ env.SNOW_USERNAME }}
      serviceNowPassword: ${{ secrets.SNOW_PASSWORD }}
```

### Determine a Commit's Associated Change Request

This step assumes that the change request was created with this action, otherwise it's unlikely to work.

#### Example

```yaml
  - name: Find Change Request
    id: cr
    uses: liatrio/snow-change-request-action@v0.1.0
    with:
      action: lookup-change-request
      githubToken: ${{ secrets.GITHUB_TOKEN }}
```

## Local Development

The easiest way to do local development is to pass all the inputs as environment variables.
Note that any defaults set in `action.yaml` won't apply automatically, they must also be passed.

```
$ INPUT_SERVICENOWURL='https://dev123.service-now.com'
$ INPUT_SERVICENOWUSERNAME='admin'
$ INPUT_SERVICENOWPASSWORD='admin'
$ INPUT_ACTION=create
$ INPUT_CHANGEREQUESTMESSAGE='Automated deployment'
$ INPUT_GITHUBTOKEN='ghp_pat'
$ INPUT_APPROVALASSIGNMENTGROUP='CAB Approval'
$ GITHUB_REPOSITORY='rode/demo-app-deployment'
$ GITHUB_EVENT_PATH=event.json

$ node index.js
```

Before opening a pull request, run `yarn verify` to check formatting, lint, and run tests. 

Fix formatting issues with `yarn fmt`, see lint errors with `yarn lint`, and run all the unit tests with `yarn test`.
