# Test script for the notes API
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

Write-Host '1) Sign up a new user'
$signupBody = '{"name":"Test User","email":"test@example.com","password":"password123"}'
try {
    $signupResponse = Invoke-RestMethod -Uri "$authUrl/signup" -Method Post -Body $signupBody -ContentType 'application/json'
    $signupResponse | Format-List
    $token = $signupResponse.token
} catch {
    Write-Host 'User already exists, continuing with login...'
}
$headers = @{ Authorization = "Bearer $token" }

Write-Host '2) Log in with the user'
$loginBody = '{"email":"test@example.com","password":"password123"}'
$loginResponse = Invoke-RestMethod -Uri "$authUrl/login" -Method Post -Body $loginBody -ContentType 'application/json'
$loginResponse | Format-List
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

Write-Host '3) Get current user (me)'
$meResponse = Invoke-RestMethod -Uri "$authUrl/me" -Method Get -Headers $headers
$meResponse | Format-List

Write-Host '4) Create a note'
$createBody = '{"title":"Test note","content":"This is a test note."}'
$createResponse = Invoke-RestMethod -Uri $notesUrl -Method Post -Body $createBody -ContentType 'application/json' -Headers $headers
$createResponse | Format-List

$noteId = $createResponse.id
Write-Host "Created note id: $noteId"

Write-Host '5) Get note by id'
$noteResponse = Invoke-RestMethod -Uri "$notesUrl/$noteId" -Method Get -Headers $headers
$noteResponse | Format-List

Write-Host '6) Get all notes'
$allNotes = Invoke-RestMethod -Uri $notesUrl -Method Get -Headers $headers
$allNotes | Format-List

Write-Host '7) Get paginated notes (page=1, limit=1)'
$paginatedUrl = "$notesUrl`?page=1`&limit=1"
$paginatedNotes = Invoke-RestMethod -Uri $paginatedUrl -Method Get -Headers $headers
$paginatedNotes | Format-List

Write-Host '8) Update the note'
$updateBody = '{"title":"Updated note","content":"This note was updated."}'
$updatedNote = Invoke-RestMethod -Uri "$notesUrl/$noteId" -Method Put -Body $updateBody -ContentType 'application/json' -Headers $headers
$updatedNote | Format-List

Write-Host '9) Delete the note'
Invoke-RestMethod -Uri "$notesUrl/$noteId" -Method Delete -Headers $headers
Write-Host 'Deleted note.'

Write-Host '10) Confirm delete returns 404'
try {
    Invoke-RestMethod -Uri "$notesUrl/$noteId" -Method Get -Headers $headers
    Write-Host 'ERROR: note still exists after delete'
} catch {
    Write-Host 'Expected failure after delete:'
    $_.Exception.Message
}

Write-Host '11) Confirm notes API rejects requests without a token'
try {
    Invoke-RestMethod -Uri $notesUrl -Method Get
    Write-Host 'ERROR: notes API allowed unauthenticated request'
} catch {
    Write-Host 'Expected failure without token:'
    $_.Exception.Message
}

Write-Host '12) Log out'
Invoke-RestMethod -Uri "$authUrl/logout" -Method Post -Headers $headers
Write-Host 'Logged out.'

Write-Host '13) Confirm revoked token is rejected'
try {
    Invoke-RestMethod -Uri $notesUrl -Method Get -Headers $headers
    Write-Host 'ERROR: revoked token was accepted'
} catch {
    Write-Host 'Expected failure with revoked token:'
    $_.Exception.Message
}

Write-Host 'Authentication and notes API test completed.'