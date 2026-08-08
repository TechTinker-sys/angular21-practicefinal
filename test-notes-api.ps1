# Test script for the notes API
# Usage:
# 1. Open PowerShell in the repo root.
# 2. Run the server in one terminal:
#    npm install
#    npm run build
#    npm run serve:ssr:angular21-practice
# 3. Run this script in a second terminal:
#    .\test-notes-api.ps1

$baseUrl = 'http://localhost:4000/api/notes'

Write-Host 'Testing notes API endpoints...'

Write-Host '1) Create a note'
$createBody = '{"title":"Test note","content":"This is a test note."}'
$createResponse = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $createBody -ContentType 'application/json'
$createResponse | Format-List

$noteId = $createResponse.id
Write-Host "Created note id: $noteId"

Write-Host '2) Get note by id'
$noteResponse = Invoke-RestMethod -Uri "$baseUrl/$noteId" -Method Get
$noteResponse | Format-List

Write-Host '3) Get all notes'
$allNotes = Invoke-RestMethod -Uri $baseUrl -Method Get
$allNotes | Format-List

Write-Host '4) Get paginated notes (page=1, limit=1)'
$paginatedNotes = Invoke-RestMethod -Uri "$baseUrl?page=1&limit=1" -Method Get
$paginatedNotes | Format-List

Write-Host '5) Update the note'
$updateBody = '{"title":"Updated note","content":"This note was updated."}'
$updatedNote = Invoke-RestMethod -Uri "$baseUrl/$noteId" -Method Put -Body $updateBody -ContentType 'application/json'
$updatedNote | Format-List

Write-Host '6) Delete the note'
Invoke-RestMethod -Uri "$baseUrl/$noteId" -Method Delete
Write-Host 'Deleted note.'

Write-Host '7) Confirm delete returns 404'
try {
    Invoke-RestMethod -Uri "$baseUrl/$noteId" -Method Get
    Write-Host 'ERROR: note still exists after delete'
} catch {
    Write-Host 'Expected failure after delete:'
    $_.Exception.Message
}

Write-Host 'Notes API test completed.'
