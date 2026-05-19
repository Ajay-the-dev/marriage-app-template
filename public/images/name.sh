#!/bin/bash

# Initialize the counter
count=1

# Loop through all files starting with "WhatsApp" (case-insensitive)
for file in [Ww]hats[Aa]pp*; do
    
    # Check if any matching files actually exist
    [ -e "$file" ] || continue
    
    # Determine the extension (keeps .jpeg, .jpg, etc.)
    ext="${file##*.}"
    
    # Define the new name
    new_name="${count}.${ext}"
    
    # Safety check: ensure we don't overwrite an existing file
    while [ -e "$new_name" ]; do
        ((count++))
        new_name="${count}.${ext}"
    done
    
    # Rename the file
    mv "$file" "$new_name"
    echo "Renamed: $file -> $new_name"
    
    # Increment counter for the next file
    ((count++))
done

echo "Batch renaming complete!"
