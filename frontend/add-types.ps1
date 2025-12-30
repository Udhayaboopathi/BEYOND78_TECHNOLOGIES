# PowerShell script to add TypeScript type imports to component files
$componentsDir = "c:\Users\sasid\Desktop\portflio\BEYOND78_TECHNOLOGIES\frontend\src\components"

# Function to add type imports after the Material-UI imports
function Add-TypeImports {
    param(
        [string]$FilePath,
        [string[]]$Types
    )
    
    $content = Get-Content $FilePath -Raw
    
    # Check if types are already imported
    if ($content -notmatch 'from\s+"\.\.\/types"') {
        # Find the last import from "../api"
        $apiImportPattern = 'from\s+"\.\.\/api";'
        if ($content -match $apiImportPattern) {
            $typeImport = "`nimport { $($Types -join ', ') } from '../types';"
            $content = $content -replace '(from\s+"\.\.\/api";)', "`$1$typeImport"
            Set-Content -Path $FilePath -Value $content -NoNewline
            Write-Host "Added type imports to $FilePath"
        }
    }
}

# Add type imports to each component
Add-TypeImports "$componentsDir\Commodities.tsx" @("Commodity", "UOM", "CommodityFormData")
Add-TypeImports "$componentsDir\UOMs.tsx" @("UOM", "UOMFormData")
Add-TypeImports "$componentsDir\Blends.tsx" @("Blend", "BlendComponent", "Commodity")
Add-TypeImports "$componentsDir\BlendComponents.tsx" @("BlendComponent", "Blend", "Commodity")
Add-TypeImports "$componentsDir\Locations.tsx" @("Location", "LocationFormData")
Add-TypeImports "$componentsDir\CounterParties.tsx" @("CounterParty", "CounterPartyFormData")
Add-TypeImports "$componentsDir\Capacity.tsx" @("Capacity", "CapacityFormData", "Commodity", "Location")
Add-TypeImports "$componentsDir\CreateBlend.tsx" @("Blend", "Commodity", "BlendComponent")
Add-TypeImports "$componentsDir\ImportDialog.tsx" @("ImportDialogProps", "ImportResult")
Add-TypeImports "$componentsDir\EnhancedImportDialog.tsx" @("EnhancedImportDialogProps", "ImportResult")

Write-Host "Type imports added to all component files"
