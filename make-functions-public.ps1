# Make Cloud Functions publicly accessible

Write-Host "Making Cloud Functions public..." -ForegroundColor Green

# Set project
$project = "svinnstop"
$region = "us-central1"

# Functions to make public
$functions = @("createCheckoutSession", "stripeWebhook")

foreach ($func in $functions) {
    Write-Host "Setting IAM policy for $func..." -ForegroundColor Yellow
    
    # Create policy binding
    $policyJson = @{
        bindings = @(
            @{
                role = "roles/cloudfunctions.invoker"
                members = @("allUsers")
            }
        )
    } | ConvertTo-Json -Depth 10
    
    # Save to temp file
    $tempFile = "policy-temp.json"
    $policyJson | Out-File -FilePath $tempFile -Encoding UTF8
    
    # Apply policy using Firebase CLI (works without gcloud)
    Write-Host "Note: This requires manual setup. Please run:" -ForegroundColor Cyan
    Write-Host "gcloud functions add-iam-policy-binding $func --region=$region --member=allUsers --role=roles/cloudfunctions.invoker --project=$project" -ForegroundColor White
}

Write-Host "`nAlternatively, use the Firebase emulator or manual Google Cloud Console setup." -ForegroundColor Yellow
Write-Host "Since gcloud is not installed, I'll create a curl command instead..." -ForegroundColor Yellow

Write-Host "`nRun these commands in a terminal with curl installed:" -ForegroundColor Green
foreach ($func in $functions) {
    Write-Host "curl -X POST \`"https://cloudfunctions.googleapis.com/v1/projects/$project/locations/$region/functions/$func:setIamPolicy\`" -H \`"Authorization: Bearer `$(gcloud auth print-access-token)\`" -H \`"Content-Type: application/json\`" -d '{`"policy`":{`"bindings`":[{`"role`":`"roles/cloudfunctions.invoker`",`"members`":[`"allUsers`"]}]}}'" -ForegroundColor White
}
