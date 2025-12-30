# Script to convert JSX files to TSX with TypeScript types
import os
import re

components_dir = r"c:\Users\sasid\Desktop\portflio\BEYOND78_TECHNOLOGIES\frontend\src\components"

jsx_files = [
    "Commodities.jsx",
    "UOMs.jsx", 
    "Blends.jsx",
    "BlendComponents.jsx",
    "Locations.jsx",
    "CounterParties.jsx",
    "Capacity.jsx",
    "CreateBlend.jsx",
    "ImportDialog.jsx",
    "EnhancedImportDialog.jsx"
]

def convert_jsx_to_tsx(content, filename):
    """Convert JSX content to TypeScript TSX"""
    
    # Remove .jsx extensions from imports
    content = re.sub(r'from\s+"\.\/([^"]+)\.jsx"', r'from "./\1"', content)
    content = re.sub(r"from\s+'\.\/([^']+)\.jsx'", r"from './\1'", content)
    content = re.sub(r'from\s+"\.\./api"', r'from "../api"', content)
    
    # Add React.FC type to function components
    # Find function component declarations
    if 'function ' + filename.replace('.jsx', '').replace('.tsx', '') in content:
        pattern = r'function\s+(' + filename.replace('.jsx', '').replace('.tsx', '') + r')\s*\('
        
        # Check if it has props parameter
        if re.search(pattern + r'(\w+)\)', content):
            # Has props
            content = re.sub(
                pattern + r'(\w+)\)',
                r'const \1: React.FC<any> = (\2) =>',
                content
            )
        else:
            # No props
            content = re.sub(
                pattern + r'\)',
                r'const \1: React.FC = () =>',
                content
            )
    
    return content

# Print conversion summary
print("Converting JSX to TSX files...")
for jsx_file in jsx_files:
    print(f"Would convert: {jsx_file} -> {jsx_file.replace('.jsx', '.tsx')}")
