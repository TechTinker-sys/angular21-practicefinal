# Test script for the notes API with approval workflow
# Usage:
# 1. Open PowerShell in the repo root.
# 2. Run the server in one terminal:
#    npm install
#    npm run build
#    npm run serve:ssr:angular21-practice
# 3. Run this script in a second terminal:
#    .\test-notes-api.ps1

$baseUrl = 'http://localhost:4000/api'
$authUrl = "$baseUrl/auth"
$notesUrl = "$baseUrl/notes"

Write-Host 'Testing authentication and notes API endpoints...'

Write-Host '1) Log in as admin'
$loginBody = '{"email":"admin@example.com","password":"admin123"}'
$loginResponse = Invoke-RestMethod -Uri "$authUrl/login" -Method Post -Body $loginBody -ContentType 'application/json'
$adminToken = $loginResponse.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Write-Host "  Admin logged in (id: $($loginResponse.user.id))"

Write-Host '2) Log in as viewer'
$loginBody = '{"email":"viewer@example.com","password":"viewer123"}'
$loginResponse = Invoke-RestMethod -Uri "$authUrl/login" -Method Post -Body $loginBody -ContentType 'application/json'
$viewerToken = $loginResponse.token
$viewerHeaders = @{ Authorization = "Bearer $viewerToken" }
Write-Host "  Viewer logged in (id: $($loginResponse.user.id))"

Write-Host '3) Viewer creates a note (should be pending approval)'
$createBody = '{"title":"Viewer pending note","content":"This note needs admin approval."}'
$createResponse = Invoke-RestMethod -Uri $notesUrl -Method Post -Body $createBody -ContentType 'application/json' -Headers $viewerHeaders
$viewerNoteId = $createResponse.id
Write-Host "  Created note id: $viewerNoteId"
Write-Host "  Approved: $($createResponse.approved) (expect False)"
Write-Host "  Author: $($createResponse.authorName)"
if ($createResponse.approved -ne $false) {
    Write-Host 'ERROR: viewer note should be pending approval'
    exit 1
}

Write-Host '4) Viewer can read their own pending note'
$noteResponse = Invoke-RestMethod -Uri "$notesUrl/$viewerNoteId" -Method Get -Headers $viewerHeaders
Write-Host "  Note title: $($noteResponse.title)"

Write-Host '5) Viewer can update their own note'
$updateBody = '{"title":"Viewer updated note","content":"Updated by the viewer."}'
$updatedNote = Invoke-RestMethod -Uri "$notesUrl/$viewerNoteId" -Method Put -Body $updateBody -ContentType 'application/json' -Headers $viewerHeaders
Write-Host "  Updated title: $($updatedNote.title)"

Write-Host '6) Admin sees the pending viewer note in the list'
$allNotes = Invoke-RestMethod -Uri $notesUrl -Method Get -Headers $adminHeaders
$pendingNote = $allNotes.notes | Where-Object { $_.id -eq $viewerNoteId }
Write-Host "  Admin sees note: $($pendingNote.title), approved=$($pendingNote.approved)"

Write-Host '7) Admin approves the viewer note'
$approvalResponse = Invoke-RestMethod -Uri "$notesUrl/$viewerNoteId/approve" -Method Put -ContentType 'application/json' -Headers $adminHeaders
Write-Host "  Approved: $($approvalResponse.approved) (expect True)"
if ($approvalResponse.approved -ne $true) {
    Write-Host 'ERROR: admin approval failed'
    exit 1
}

Write-Host '8) Admin creates an approved note'
$createBody = '{"title":"Admin approved note","content":"Created directly by admin."}'
$adminNote = Invoke-RestMethod -Uri $notesUrl -Method Post -Body $createBody -ContentType 'application/json' -Headers $adminHeaders
Write-Host "  Approved: $($adminNote.approved) (expect True)"
Write-Host "  Author: $($adminNote.authorName)"

Write-Host '9) Admin can update any note'
$updateBody = '{"title":"Admin updated viewer note"}'
$updatedNote = Invoke-RestMethod -Uri "$notesUrl/$viewerNoteId" -Method Put -Body $updateBody -ContentType 'application/json' -Headers $adminHeaders
Write-Host "  Updated viewer note title: $($updatedNote.title)"

Write-Host '10) Viewer cannot delete admin note (expect 403)'
try {
    Invoke-RestMethod -Uri "$notesUrl/$($adminNote.id)" -Method Delete -Headers $viewerHeaders
    Write-Host 'ERROR: viewer should not be able to delete admin note'
    exit 1
} catch {
    Write-Host "  Expected failure: $($_.Exception.Response.StatusCode.value__) $($_.Exception.Response.StatusDescription)"
}

Write-Host '11) Viewer can delete their own note'
Invoke-RestMethod -Uri "$notesUrl/$viewerNoteId" -Method Delete -Headers $viewerHeaders
Write-Host '  Deleted viewer note.'

Write-Host '12) Admin can delete any note'
Invoke-RestMethod -Uri "$notesUrl/$($adminNote.id)" -Method Delete -Headers $adminHeaders
Write-Host '  Deleted admin note.'

Write-Host '13) Viewer cannot approve a note (expect 403)'
try {
    $createBody = '{"title":"Another pending","content":"Needs approval"}'
    $another = Invoke-RestMethod -Uri $notesUrl -Method Post -Body $createBody -ContentType 'application/json' -Headers $viewerHeaders
    Invoke-RestMethod -Uri "$notesUrl/$($another.id)/approve" -Method Put -ContentType 'application/json' -Headers $viewerHeaders
    Write-Host 'ERROR: viewer should not be able to approve notes'
    exit 1
} catch {
    Write-Host "  Expected failure: $($_.Exception.Response.StatusCode.value__) $($_.Exception.Response.StatusDescription)"
    # Cleanup the created pending note
    Invoke-RestMethod -Uri "$notesUrl/$($another.id)" -Method Delete -Headers $viewerHeaders
}

Write-Host '14) Confirm notes API rejects requests without a token'
try {
    Invoke-RestMethod -Uri $notesUrl -Method Get
    Write-Host 'ERROR: notes API allowed unauthenticated request'
} catch {
    Write-Host "  Expected failure: $($_.Exception.Response.StatusCode.value__) $($_.Exception.Response.StatusDescription)"
}

Write-Host '15) Log out admin'
Invoke-RestMethod -Uri "$authUrl/logout" -Method Post -Headers $adminHeaders
Write-Host '  Logged out.'

Write-Host 'Notes approval workflow API test completed successfully.'