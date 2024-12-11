# What's New

We are enhancing the widget with the following features:

#### 1. **Usability Improvements**  
- Now, this wizard shows IOC settings in a more structured and user friendly way. Users now can review/edit the indicator types and add custom Regex for a new ones using user interface.

#### 2. **IOC Validation (Manual Input)**  
- A validation message will appear if an invalid IOC is manually entered.
- This feature also ensures that only unique indicator will entered.

#### 3. **Search Functionality**  
- A search feature is added to help users quickly find IOCs in the excluded list. Results will be grouped by indicator type.

#### 4. **Bulk Upload**  
- Users can upload IOCs in various formats (.csv, .txt, .pdf, .xls, .xlsx, .doc, .docx). The option to extract defanged indicators from the file will also be available.
- This feature by default ignores invalid and non-supported types

#### 5. **Add Custom Indicator Type**  
- Users can create new custom indicator types and define their corresponding Regex. These new types will be added to the `IndicatorType` picklist and the regex mapping keystore.

#### 6. **Configure Indicator Type Mapping**  
- Indicator Type Mapping 
    - Users can map alert or incident fields to corresponding IOC types.
- Creation of File IOCs 
    - A preference option is added for whether file IOCs should be created for attachments in alerts.
- Comments for excluded files 
    - Users can also choose to add comments to alerts when a file is excluded from extraction.