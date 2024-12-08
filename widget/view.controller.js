/* Copyright start
  MIT License
  Copyright (c) 2024 Fortinet Inc
  Copyright end */

'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('configureIndicatorExtraction200Ctrl', configureIndicatorExtraction200Ctrl);

  configureIndicatorExtraction200Ctrl.$inject = ['$scope', 'widgetUtilityService', '$rootScope', 'widgetBasePath', 'WizardHandler', 'iocExtractionConfigService', 'toaster', 'Upload', 'API', 'Entity', '_'];

  function configureIndicatorExtraction200Ctrl($scope, widgetUtilityService, $rootScope, widgetBasePath, WizardHandler, iocExtractionConfigService, toaster, Upload, API, Entity, _) {
    // Exclusion List Setting Functionality
    var _defaultGlobalSettings = {};
    var _defaultExclusionSettings = {};
    $scope.updatedExclusionSettings = {};
    var _defaultIOCTypeFieldMapping = {};
    $scope.updatedIOCTypeFieldMapping = {};
    var _defaultIOCTypeReGexMapping = {};
    var _updatedIOCTypeReGexMapping = {};
    var _regexDict = {};
    $scope.initList = [];
    $scope.invalidIOCs = {}; // This dict holds invalid IOCs for various indicator types
    $scope.validateIOC = validateIOC;

    // Wizard Functions
    $scope.moveNext = moveNext;
    $scope.moveBack = moveBack;

    // Search Functionality
    $scope.searchString = { searchText: '' };
    $scope.searchStatus = 'off';
    $scope.setSearchStatus = setSearchStatus;
    $scope.updateSearchQuery = updateSearchQuery;

    // Bulk Import Functionality
    const _maxFileSize = 25072682;
    const _ignoredIndicatorTypes = ['results', 'unified_result', 'allowed_list_results'];
    var _bulkUploadFileIRI;
    $scope.fileName = '';
    $scope.uploadedFileFlag = false;
    $scope.supportedFileTypes = '.csv,.txt,.pdf,.xls,.xlsx,.doc,.docx';
    $scope.loadingJob = false;
    $scope.extractDefangedIOCsFlag = false;
    $scope.bulkImportInProgress = false;
    $scope.uploadFiles = uploadFiles;
    $scope.setBulkImportFlags = setBulkImportFlags;
    $scope.importIOCsFromFile = importIOCsFromFile;
    $scope.updateDefangSelection = updateDefangSelection;

    // "Add New Indicator Type" Functionality
    var _customIOCTypeList = [];
    var _indicatorTypePicklistUUID = '50ee5bfa-e18f-49ba-8af9-dcca25b0f9c0';
    var _defaultIndicatorTypePicklistItems = {};
    var _updatedIndicatorTypePicklistItems = {};
    $scope.notYetEnteredIOCTypes = [];
    $scope.selectedIndicatorType = { iocType: '', pattern: '', dropDownValue: '' };
    $scope.addCustomIOCType = false;
    $scope.duplicateIOCTypeFlag = false;
    $scope.setAddNewIOCFlags = setAddNewIOCFlags;
    $scope.indicatorTypeChanged = indicatorTypeChanged;
    $scope.saveNewIOCType = saveNewIOCType;
    $scope.clearDuplicateIOCErrorMsg = clearDuplicateIOCErrorMsg;

    // "Edit Indicator Type Regex" Functionality
    $scope.isRegexInReview = false;
    $scope.iocRegexUnderEdit = {};
    $scope.editIndicatorTypeRegex = editIndicatorTypeRegex;
    $scope.saveIOCTypeRegex = saveIOCTypeRegex;
    $scope.resetEditRegexFlags = resetEditRegexFlags;

    // Theme and Image File Paths
    $scope.widgetCSS = widgetBasePath + 'widgetAssets/css/wizard-style.css';
    let _themeID = $rootScope.theme.id;
    $scope.isDarkTheme = _themeID === 'dark';
    $scope.isLightTheme = _themeID === 'light';
    $scope.isSteelTheme = _themeID === 'steel';
    const _themeCSS = {
      dark: 'wizard-style-dark.css',
      light: 'wizard-style-light.css',
      steel: 'wizard-style-steel.css',
    }
    $scope.themeCSS = widgetBasePath + 'widgetAssets/css/' + (_themeCSS[_themeID]);
    $scope.pageImages = {
      'startPageImage': $scope.isLightTheme ? widgetBasePath + 'images/ioc-extraction-start-light.png' : widgetBasePath + 'images/ioc-extraction-start-dark.png',
      'excludeIOCPageImage': $scope.isLightTheme ? widgetBasePath + 'images/ioc-extraction-exclusion-light.png' : widgetBasePath + 'images/ioc-extraction-exclusion-dark.png',
      'fieldMappingPageImage': $scope.isLightTheme ? widgetBasePath + 'images/ioc-extraction-field-map-light.png' : widgetBasePath + 'images/ioc-extraction-field-map-dark.png',
      'finishPageImage': widgetBasePath + 'images/ioc-extraction-finish-both.png'
    };

    // Field Mapping Page
    $scope.moduleList = ['Alerts', 'Incidents'];
    $scope.selectedModule = $scope.moduleList[0];
    $scope.getSelectedModuleFields = getSelectedModuleFields;
    $scope.fieldIndicatorTypeChanged = fieldIndicatorTypeChanged;
    $scope.searchParam = { searchByTitle: '', searchByIocType: '' };
    $scope.fieldMappingSearchFilter = fieldMappingSearchFilter;

    // Summary Page
    var _fieldMappingSummary = { fieldMappingUpdate: [], fieldFlagsUpdate: [] }
    var _exclusionSummary = [];
    $scope.summary = {
      exclusionSettingSummary: [],
      fieldMappingSummary: { fieldMappingUpdate: [], fieldFlagsUpdate: [] }
    }


    function resetEditRegexFlags(iocTypeName) {
      delete $scope.iocRegexUnderEdit[iocTypeName];
      if (Object.keys($scope.iocRegexUnderEdit).length === 0) {
        $scope.editIOCTypeRegexInProcess = false;
        $scope.isRegexInReview = false;
      }
    }


    function saveIOCTypeRegex(iocTypeName) {
      const regexPattern = $scope.iocRegexUnderEdit[iocTypeName].pattern;
      $scope.updatedExclusionSettings.recordValue[iocTypeName].pattern[0] = regexPattern;
      _updatedIOCTypeReGexMapping.recordValue.forEach(function (item) {
        if (item.indicator_type === iocTypeName) {
          item.pattern_regx = regexPattern;
        }
      });
      resetEditRegexFlags(iocTypeName);
    }


    function editIndicatorTypeRegex(indicatorType, iocRegex) {
      $scope.bulkImportEnable = false;
      $scope.addNewIndicatorTypeInProcess = false;
      $scope.editIOCTypeRegexInProcess = true;
      $scope.iocRegexUnderEdit[indicatorType] = { pattern: iocRegex, isEditing: true };
    }


    function _computeFieldMappingSummary() {
      if (_fieldMappingSummary.fieldMappingUpdate.length > 0) {
        $scope.summary.fieldMappingSummary.fieldMappingUpdate = [];
        let _touchedModules = new Set(_fieldMappingSummary.fieldMappingUpdate);
        let _changedModules = new Set();
        _touchedModules.forEach(function (_moduleName) {
          let _updatedFieldMapping = $scope.updatedIOCTypeFieldMapping.recordValue.fieldTypeMapping[_moduleName.toLowerCase()];
          let _defaultFieldMapping = _defaultIOCTypeFieldMapping.recordValue.fieldTypeMapping[_moduleName.toLowerCase()];
          if (!_.isEqual(_updatedFieldMapping, _defaultFieldMapping)) {
            _changedModules.add(_moduleName);
          }
        });
        if (_changedModules.size > 0) {
          let _fieldTypeSummaryMessage = $scope.viewWidgetVars.FINISH_PAGE_FIELD_TYPE_SUMMARY_MESSAGE;
          const _changedModulesArray = Array.from(_changedModules);
          if (_changedModulesArray.length > 1) {
            _fieldTypeSummaryMessage += _changedModulesArray.slice(0, -1).join(', ') + ' and ' + _changedModulesArray[_changedModulesArray.length - 1];
          } else {
            _fieldTypeSummaryMessage += _changedModulesArray[0];
          }
          $scope.summary.fieldMappingSummary.fieldMappingUpdate.push(_fieldTypeSummaryMessage);
        } else {
          $scope.summary.fieldMappingSummary.fieldMappingUpdate.push($scope.viewWidgetVars.FINISH_PAGE_NO_FIELD_MAPPING_CHANGE_MESSAGE);
        }
      } else {
        $scope.summary.fieldMappingSummary.fieldMappingUpdate.push($scope.viewWidgetVars.FINISH_PAGE_NO_FIELD_MAPPING_CHANGE_MESSAGE);
      }
      if (_fieldMappingSummary.fieldFlagsUpdate.length > 0) {
        $scope.summary.fieldMappingSummary.fieldFlagsUpdate = [];
        let _touchedFlags = new Set(_fieldMappingSummary.fieldFlagsUpdate);
        _touchedFlags.forEach(function (_flagName) {
          let _updatedFlag = $scope.updatedIOCTypeFieldMapping.recordValue[_flagName];
          let _defaultFlag = _defaultIOCTypeFieldMapping.recordValue[_flagName];
          if (_updatedFlag !== _defaultFlag) {
            if (_flagName === 'createFileIOCs') {
              $scope.summary.fieldMappingSummary.fieldFlagsUpdate.push(
                _updatedFlag ? $scope.viewWidgetVars.FINISH_PAGE_CREATE_FILE_IOC_MESSAGE : $scope.viewWidgetVars.FINISH_PAGE_SKIP_CREATE_FILE_IOC_MESSAGE
              );
            }
            if (_flagName === 'addExcludedFileComment') {
              $scope.summary.fieldMappingSummary.fieldFlagsUpdate.push(
                _updatedFlag ? $scope.viewWidgetVars.FINISH_PAGE_ADD_EXCLUDED_FILE_COMMENT_MESSAGE : $scope.viewWidgetVars.FINISH_PAGE_SKIP_EXCLUDED_FILE_COMMENT_MESSAGE
              );
            }
          }
        });
      }
    }


    function fieldMappingSearchFilter(item) {

      let searchByTitle = $scope.searchParam.searchByTitle ? $scope.searchParam.searchByTitle.toLowerCase() : '';
      let searchByIocType = $scope.searchParam.searchByIocType ? $scope.searchParam.searchByIocType.toLowerCase() : '';

      let titleMatch = !searchByTitle || item[1].title.toLowerCase().includes(searchByTitle);
      let iocTypeMatch = !searchByIocType || item[1].iocType.toLowerCase().includes(searchByIocType);

      return titleMatch && iocTypeMatch;

    }

    function _getSortedFieldTypes(fieldTypeMapping) {
      $scope.sortedFieldTypes = Object.entries(fieldTypeMapping).sort(function ([keyA], [keyB]) {
        return keyA.localeCompare(keyB);
      });
    }


    function _commitFieldMappingChanges() {
      _defaultGlobalSettings['Indicator Type Mapping'] = $scope.updatedIOCTypeFieldMapping.recordValue;
      iocExtractionConfigService.updateKeyStoreRecord(_defaultGlobalSettings, $scope.updatedIOCTypeFieldMapping.recordUUID);
    }


    function fieldIndicatorTypeChanged(fieldName, iocType, action) {
      const mapping = $scope.updatedIOCTypeFieldMapping.recordValue;
      const _selectedModule = $scope.selectedModule.toLowerCase();

      if (action === 'fieldMappingUpdate') {
        if (iocType && iocType !== $scope.viewWidgetVars.IOC_TYPE_MAPPING_PAGE_NOT_SET_LIST_ITEM) { // This checks for non-empty, non-undefined, and non-null values
          mapping.fieldTypeMapping[_selectedModule][fieldName] = iocType;
          _fieldMappingSummary[action].push(_selectedModule);
        } else {
          delete mapping.fieldTypeMapping[_selectedModule][fieldName];
          _fieldMappingSummary[action].push(_selectedModule);
        }
      } else if (action === 'fieldFlagsUpdate') {
        mapping[fieldName] = iocType;
        _fieldMappingSummary[action].push(fieldName);
      }
    }


    function getSelectedModuleFields(moduleName) {
      $scope.selectedModule = moduleName;
      _loadAttributes();
    }


    function _loadAttributes() {
      // Fetch all the fields of the selected module
      $scope.fieldTypeMapping = {};
      $scope.iocTypePicklistItems = _updatedIndicatorTypePicklistItems.picklists.map(function (item) {
        return item.itemValue;
      });
      const _selectedModule = $scope.selectedModule.toLowerCase();
      $scope.fieldTypeMapping[_selectedModule] = {}
      var entity = new Entity(_selectedModule);
      entity.loadFields().then(function () {
        let fields = entity.getFormFields();
        const excludedTypes = new Set(['datetime', 'picklist', 'checkbox', 'lookup', 'tags', 'integer']);
        angular.forEach(fields, function (value, key) {
          if (!excludedTypes.has(value.type)) {
            $scope.fieldTypeMapping[_selectedModule][key] = {
              title: value.title,
              iocType: $scope.updatedIOCTypeFieldMapping.recordValue.fieldTypeMapping[_selectedModule][key] || $scope.viewWidgetVars.IOC_TYPE_MAPPING_PAGE_NOT_SET_LIST_ITEM
            }
          }
        });
        _getSortedFieldTypes($scope.fieldTypeMapping[_selectedModule]);
      }).catch(function () {
        toaster.error({ body: $scope.viewWidgetVars.IOC_TYPE_MAPPING_PAGE_FIELD_LOADING_ERROR });
      });
    }


    function updateDefangSelection(status) {
      // Sets a flag based of value of Defang checkbox
      $scope.extractDefangedIOCsFlag = status;
    }


    function clearDuplicateIOCErrorMsg() {
      if ($scope.duplicateIOCTypeFlag) {
        if ($scope.duplicateIOCTypeName !== $scope.selectedIndicatorType.iocType) {
          $scope.duplicateIOCTypeFlag = false;
        }
      } else {
        return;
      }
    }


    function _commitRegexPatternChanges() {
      iocExtractionConfigService.updateKeyStoreRecord(_updatedIOCTypeReGexMapping.recordValue, _updatedIOCTypeReGexMapping.recordUUID);
    }


    function _addNewRegexToKeystore(iocTypeName) {
      let regexKeyStoreTemplate = iocExtractionConfigService.constants().regexKeyStoreTemplate;
      regexKeyStoreTemplate['pattern_regx'] = $scope.selectedIndicatorType.pattern;
      regexKeyStoreTemplate['indicator_type'] = iocTypeName;
      _updatedIOCTypeReGexMapping.recordValue.push(regexKeyStoreTemplate);
    }


    function _commitIndicatorTypePicklist(newIOCList) {
      let orderIndex = _updatedIndicatorTypePicklistItems.picklists.length;
      newIOCList.forEach(function (iocTypeName) {
        let newPicklistItem = { 'itemValue': iocTypeName, 'orderIndex': orderIndex };
        _updatedIndicatorTypePicklistItems.picklists.push(newPicklistItem);
        orderIndex = orderIndex + 1;
      });
      let payload = _updatedIndicatorTypePicklistItems;
      iocExtractionConfigService.updatePicklist(payload, _indicatorTypePicklistUUID);
    }


    function _addNewIocTypeToKeystore(iocTypeName) {
      let keyStoreTemplate = iocExtractionConfigService.constants().keyStoreTemplate;
      if ($scope.selectedIndicatorType.pattern !== '' && $scope.selectedIndicatorType.pattern.length > 0) {
        keyStoreTemplate['pattern'].push($scope.selectedIndicatorType.pattern);
      }
      if ($scope.addCustomIOCType) {
        keyStoreTemplate['system'] = false;
      }
      if (!$scope.isRegexAvailable) {
        keyStoreTemplate['isRegexEditable'] = true;
      }
      $scope.updatedExclusionSettings.recordValue[iocTypeName] = keyStoreTemplate;
    }


    function importIOCsFromFile() {
      $scope.bulkImportInProgress = true;
      iocExtractionConfigService.getFileContent(_bulkUploadFileIRI).then(function (fileContent) {
        if (!fileContent || !fileContent.data || !fileContent.data.extracted_text) {
          toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_CONTENT_INVALID });
          $scope.enableSpinner = false;
          setBulkImportFlags('resetFileUpload');
          return;
        }
        iocExtractionConfigService.getArtifactsFromFile(fileContent.data.extracted_text, $scope.extractDefangedIOCsFlag).then(function (response) {
          if (response && response.data && response.data.results && response.data.results.length > 0) {
            Object.entries(response.data).forEach(function ([iocType, iocList]) {
              if (Array.isArray(iocList) && iocList.length > 0 && !_ignoredIndicatorTypes.includes(iocType)) {
                let mapping = iocExtractionConfigService.constants().iocTypeNameMapping;
                let indicatorType = iocType;
                for (const [key, value] of Object.entries(mapping)) {
                  if (value.includes(iocType)) {
                    indicatorType = key;
                    break;
                  }
                }

                if ($scope.updatedExclusionSettings.recordValue[indicatorType]) {
                  $scope.updatedExclusionSettings.recordValue[indicatorType].excludedIOCs = Array.from(
                    new Set([...$scope.updatedExclusionSettings.recordValue[indicatorType].excludedIOCs, ...iocList])
                  );
                }

              }
            });
            $scope.bulkImportIOCExtractionDone = true;
            $scope.enableSpinner = false;
            setBulkImportFlags('bulkImportDisable');
            toaster.success({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_COMPLETED });
          } else {
            toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_CONTENT_INVALID });
            $scope.enableSpinner = false;
            setBulkImportFlags('resetFileUpload');
          }
        })
      }).catch(function (error) {
        toaster.error({ body: error });
        $scope.enableSpinner = false;
        setBulkImportFlags('resetFileUpload');
      });
    }


    function saveNewIOCType(iocTypeName) {
      if ($scope.addCustomIOCType) {
        let _existingIOCTypes = _getNotEnteredIOCTypes();
        if (iocTypeName === '' || iocTypeName === undefined) {
          $scope.duplicateIOCTypeName = iocTypeName;
          $scope.duplicateIOCTypeFlag = true;
          $scope.duplicateIOCErrorMsg = $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_EMPTY_ERR_MSG;
          return;
        }
        else if (_customIOCTypeList.includes(iocTypeName)) {
          $scope.duplicateIOCTypeName = iocTypeName;
          $scope.duplicateIOCTypeFlag = true;
          $scope.duplicateIOCErrorMsg = '"' + iocTypeName + '"' + $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ALREADY_ADDED_ERR_MSG;
          return;
        } else if (_existingIOCTypes.includes(iocTypeName)) {
          $scope.duplicateIOCTypeName = iocTypeName;
          $scope.duplicateIOCTypeFlag = true;
          $scope.duplicateIOCErrorMsg = '"' + iocTypeName + '"' + $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ALREADY_EXISTS_ERR_MSG;
          return;
        }
        else {
          _customIOCTypeList.push(iocTypeName);
        }
      }
      _addNewIocTypeToKeystore(iocTypeName);
      if (!$scope.isRegexAvailable) {
        _addNewRegexToKeystore(iocTypeName);
      }
      _getNotEnteredIOCTypes();
      setAddNewIOCFlags('addNewIOCTypeDisabled');
    }


    function indicatorTypeChanged(iocType) {
      $scope.iocTypeSelected = true;
      if (iocType === '+ Add Custom Indicator Type') {
        $scope.isRegexAvailable = false;
        $scope.addCustomIOCType = true;
        $scope.selectedIndicatorType = { iocType: '', pattern: '', dropDownValue: '+ Add Custom Indicator Type' };
      } else {
        $scope.addCustomIOCType = false;
        $scope.selectedIndicatorType['iocType'] = iocType;
        $scope.selectedIndicatorType['pattern'] = _getRegexPattern(iocType, _regexDict).join(',');
        $scope.isRegexAvailable = true;
        if ($scope.selectedIndicatorType.pattern === '' || $scope.selectedIndicatorType.pattern.length === 0) {
          $scope.isRegexAvailable = false;
        }
        $scope.duplicateIOCTypeFlag = false;
      }
    }


    function setAddNewIOCFlags(flag) {
      if ($scope.editIOCTypeRegexInProcess) {
        const _iocRegexUnderEdit = Object.keys($scope.iocRegexUnderEdit).join(', ');
        $scope.isRegexInReview = true;
        toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_EDIT_REGEX_ENTER_REGEX_ERROR_MSG + _iocRegexUnderEdit });
        return;
      }
      if (flag === 'addNewIOCTypeEnabled') {
        $scope.addNewIndicatorTypeInProcess = true;
        $scope.bulkImportEnable = false;
        $scope.isRegexAvailable = true;
        $scope.iocTypeSelected = false;
        $scope.editIOCTypeRegexInProcess = false;
      }
      if (flag === 'addNewIOCTypeDisabled') {
        $scope.addNewIndicatorTypeInProcess = false;
        $scope.selectedIndicatorType = { iocType: '', pattern: [], dropDownValue: '' };
        $scope.addCustomIOCType = false;
        $scope.isRegexAvailable = true;
        $scope.iocTypeSelected = false;
        $scope.duplicateIOCTypeFlag = false;
        $scope.editIOCTypeRegexInProcess = false;
      }
    }


    function _getNotEnteredIOCTypes() {
      let alreadyEnteredIOCTypes = Object.keys($scope.updatedExclusionSettings.recordValue);
      let defaultIOCTypeList = _updatedIndicatorTypePicklistItems.picklists.map(function (item) {
        if (item.itemValue.includes("FileHash")) {
          return "File Hash";
        }
        return item.itemValue;
      });

      let unCommonElements = defaultIOCTypeList.filter(function (item) {
        if (item !== "CIDR Range") {
          return alreadyEnteredIOCTypes.indexOf(item) === -1;
        }
      });
      $scope.notYetEnteredIOCTypes = unCommonElements;

      return [...alreadyEnteredIOCTypes, ...defaultIOCTypeList];
    }


    function setBulkImportFlags(flag) {
      if ($scope.editIOCTypeRegexInProcess) {
        const _iocRegexUnderEdit = Object.keys($scope.iocRegexUnderEdit).join(', ');
        $scope.isRegexInReview = true;
        toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_EDIT_REGEX_ENTER_REGEX_ERROR_MSG + _iocRegexUnderEdit });
        return;
      }
      const resetFileUpload = () => {
        $scope.bulkImportIOCExtractionDone = false;
        $scope.uploadedFileFlag = false;
        $scope.loadingJob = false;
        $scope.fileName = '';
        $scope.extractDefangedIOCsFlag = false;
        $scope.bulkImportInProgress = false;
      }
      if (flag === 'bulkImportEnable') {
        $scope.bulkImportIOCExtractionDone = false;
        $scope.bulkImportEnable = true;
        $scope.addNewIndicatorTypeInProcess = false;
        $scope.extractDefangedIOCsFlag = false;
        $scope.bulkImportInProgress = false;
        $scope.editIOCTypeRegexInProcess = false;
      }
      if (flag === 'bulkImportDisable') {
        $scope.bulkImportEnable = false;
        resetFileUpload();
      }
      if (flag === 'resetFileUpload') {
        resetFileUpload();
      }
    }


    function uploadFiles(file) {
      if (file === null || file === undefined) {
        toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_EXTENSION_INVALID });
        return;
      }
      if (file.size < _maxFileSize) {
        if (file.type) {
          file.upload = Upload.upload({
            url: API.BASE + 'files',
            data: {
              file: file
            }
          });
          $scope.enableSpinner = true;
          $scope.loadingJob = true;
          file.upload.then(function (response) {
            let fileMetadata = response.data;
            _bulkUploadFileIRI = fileMetadata['@id'];
            $scope.fileName = fileMetadata.filename;
            $scope.loadingJob = false;
            $scope.uploadedFileFlag = true;
            $scope.enableSpinner = false;
          },
            function (response) {
              $scope.loadingJob = false;
              $scope.enableSpinner = false;
              if (response.status > 0) {
                $log.debug(response.status + ': ' + response.data);
              }
              var message = $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_UPLOAD_FAILED;
              if (response.status === 413) {
                message = $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_SIZE_EXCEEDED;
              }
              $scope.enableSpinner = false;
              toaster.error({ body: message });
            });
        }
      }
      else {
        $scope.enableSpinner = false;
        toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_SIZE_EXCEEDED });
      }
    }


    function _buildPayload(keyName, keyValue, action) {
      if (action === 'createKeyStore') {
        var apiPayload = iocExtractionConfigService.constants().createKeyStorePayload;
        apiPayload['key'] = keyName;
        apiPayload['jSONValue'] = keyValue;
      }
      if (action === 'findKeyStore') {
        var apiPayload = iocExtractionConfigService.constants().findKeyStorePayload;
        apiPayload['filters'][0]['value'] = keyName;
      }
      return apiPayload;
    }


    function _getRegexPattern(indicatorType, regexMapping) {
      if (indicatorType === 'File') return [];
      let mapping = iocExtractionConfigService.constants().iocTypeNameMapping;
      return (mapping[indicatorType] || [indicatorType]).map(key => regexMapping[key]).filter(value => value !== undefined);
    }


    function updateSearchQuery(searchStringValue) {
      $scope.searchStatus = 'on';
      $scope.searchString = { searchText: searchStringValue };
      $scope.globalSearchList = {}; // Contains search result
      $scope.searchResultCount = 0; // This variable counts the search results found
      if (searchStringValue.length > 0) {
        Object.keys($scope.updatedExclusionSettings.recordValue).forEach(function (indicatorType) {
          if ($scope.updatedExclusionSettings.recordValue[indicatorType].excludedIOCs.length > 0) {
            const filteredList = $scope.updatedExclusionSettings.recordValue[indicatorType].excludedIOCs.filter(function (iocValue) {
              return iocValue.toLowerCase().includes(searchStringValue.toLowerCase()); // Enables case-insensitive search
            });
            if (filteredList.length > 0) {
              $scope.searchResultCount = $scope.searchResultCount + filteredList.length;
              $scope.globalSearchList[indicatorType] = { 'type': indicatorType, 'filteredValues': filteredList };
            }
          }
        });
      }
    }


    function setSearchStatus(status) {
      if (status === 'off') {
        $scope.searchString = { searchText: '' };
      }
      $scope.searchStatus = status;
    }


    function validateIOC(updatedKeyStoreValue, indicatorType) {
      if ($scope.updatedExclusionSettings.recordValue[indicatorType].pattern.length > 0) {
        let regexPattern = $scope.updatedExclusionSettings.recordValue[indicatorType].pattern;
        let regExObjects = regexPattern.map(pattern => new RegExp(pattern)); // Creates an array of RegExp objects

        let _tempInvalidIOCs = updatedKeyStoreValue.filter(item => {
          // Checks if IOC matches any regex pattern
          return !regExObjects.some(regex => regex.test(item));
        });

        if (_tempInvalidIOCs.length > 0) {
          $scope.invalidIOCs[indicatorType] = _tempInvalidIOCs.join(', ');
        } else {
          delete $scope.invalidIOCs[indicatorType];
        }
      }
    }


    function _commitExclusionSettings() {
      const updatedExclusionSettings = $scope.updatedExclusionSettings.recordValue;
      const defaultExclusionSettings = _defaultExclusionSettings.recordValue;
      const defaultExclusionItems = new Set(Object.keys(defaultExclusionSettings));

      Object.keys(updatedExclusionSettings).forEach(function (iocType) {
        const updatedItem = updatedExclusionSettings[iocType];
        const defaultItem = defaultExclusionSettings[iocType];
        _defaultGlobalSettings[iocType] = updatedItem;

        if (defaultExclusionItems.has(iocType)) {
          let _diffCount = updatedItem.excludedIOCs.length - defaultItem.excludedIOCs.length;
          if (_diffCount > 0) {
            let summaryMsg = iocType + ' added: ' + _diffCount;
            _exclusionSummary.push(summaryMsg);
          }
          if (_diffCount < 0) {
            let summaryMsg = iocType + ' removed: ' + Math.abs(_diffCount);
            _exclusionSummary.push(summaryMsg);
          }
        } else {
          let summaryMsg = "New Indicator Type '" + iocType + "'. Values added: " + updatedItem.excludedIOCs.length;
          _exclusionSummary.push(summaryMsg);
        }
      });
      iocExtractionConfigService.updateKeyStoreRecord(_defaultGlobalSettings, $scope.updatedExclusionSettings.recordUUID);
    }


    function moveNext(param) {
      let currentStepTitle = WizardHandler.wizard('configureIndicatorExtraction').currentStep().wzTitle


      if (currentStepTitle === $scope.viewWidgetVars.START_PAGE_WZ_TITLE) {
        if (Object.keys($scope.updatedExclusionSettings).length === 0) {
          $scope.updatedExclusionSettings = angular.copy(_defaultExclusionSettings);
          $scope.updatedIOCTypeFieldMapping = angular.copy(_defaultIOCTypeFieldMapping);
          _updatedIOCTypeReGexMapping = angular.copy(_defaultIOCTypeReGexMapping);
          _updatedIndicatorTypePicklistItems = angular.copy(_defaultIndicatorTypePicklistItems);
        }
        _getNotEnteredIOCTypes();
        _loadAttributes();
        WizardHandler.wizard('configureIndicatorExtraction').next();
      }


      if (currentStepTitle === $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_WZ_TITLE) {
        if (Object.keys($scope.invalidIOCs).length > 0) {
          const _invalidIOCList = Object.keys($scope.invalidIOCs).join(', ');
          toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_VALIDATE_IOC_ERROR_MSG + _invalidIOCList });
          return;
        }

        if ($scope.editIOCTypeRegexInProcess) {
          const _iocRegexUnderEdit = Object.keys($scope.iocRegexUnderEdit).join(', ');
          $scope.isRegexInReview = true;
          toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_EDIT_REGEX_ENTER_REGEX_ERROR_MSG + _iocRegexUnderEdit });
          return;
        }

        if ($scope.addNewIndicatorTypeInProcess) {
          toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_SUBMIT_ERROR_MSG });
          return;
        }

        if ($scope.bulkImportEnable) {
          toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_SUBMIT_ERROR });
          return;
        }

        if (param === 'save') {
          _commitExclusionSettings();
          _commitRegexPatternChanges();
          if (_customIOCTypeList.length > 0) {
            _commitIndicatorTypePicklist(_customIOCTypeList);
            _customIOCTypeList = [];
          }
          $scope.summary.exclusionSettingSummary = _exclusionSummary;
          $scope.isExclusionSettingChanged = _exclusionSummary.length > 0 ? true : false;
          toaster.success({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_EXCLUSION_SETTING_SUCCESS_MSG });
          WizardHandler.wizard('configureIndicatorExtraction').next();

        } else {
          WizardHandler.wizard('configureIndicatorExtraction').next();
        }
      }

      if (currentStepTitle === $scope.viewWidgetVars.IOC_TYPE_MAPPING_PAGE_WZ_TITLE) {
        if (param === 'save') {
          _commitFieldMappingChanges();
          _computeFieldMappingSummary();
          toaster.success({ body: $scope.viewWidgetVars.IOC_TYPE_MAPPING_PAGE_SAVE_SUCCESS_MSG });
          WizardHandler.wizard('configureIndicatorExtraction').next();
        } else {
          WizardHandler.wizard('configureIndicatorExtraction').next();
        }
      }

      if (currentStepTitle === $scope.viewWidgetVars.FINISH_PAGE_WZ_TITLE) {
        WizardHandler.wizard('configureIndicatorExtraction').next();
      }
    }


    function moveBack() {
      // let currentStepTitle = WizardHandler.wizard('configureIndicatorExtraction').currentStep().wzTitle

      WizardHandler.wizard('configureIndicatorExtraction').previous();
    }


    function _initExclusionSetting() {
      // Fetch default values of 'Indicator Type' picklist items
      iocExtractionConfigService.getPicklist(_indicatorTypePicklistUUID).then(function (response) {
        _defaultIndicatorTypePicklistItems = response;
      });
      // Fetch regex mappings for different indicator types using Regex Keystore
      let keyName = 'sfsp-indicator-regex-mapping';
      let payload = _buildPayload(keyName, null, 'findKeyStore');
      iocExtractionConfigService.getKeyStoreRecord(payload, 'keys').then(function (response) {
        // Create a dictionary to map indicator types to regex patterns 
        if (response && response['hydra:member'] && response['hydra:member'].length > 0) {
          _defaultIOCTypeReGexMapping = { 'recordUUID': response['hydra:member'][0].uuid, 'recordValue': response["hydra:member"][0].jSONValue };
          _regexDict = _defaultIOCTypeReGexMapping.recordValue.reduce(function (acc, item) {
            acc[item.indicator_type] = item.pattern_regx; // Normalizing the JSON response from the utilities connector by replacing escape characters in the encoded regex
            return acc;
          }, {});
        }

        // Build payload to fetch exclusion data for all the indicator types available in keystore
        let keyStoreName = 'sfsp-indicator-extraction-configuration';
        let payload = _buildPayload(keyStoreName, null, 'findKeyStore');

        // Fetch key store record based on the payload
        iocExtractionConfigService.getKeyStoreRecord(payload, 'keys').then(function (response) {
          if (response && response['hydra:member'] && response['hydra:member'].length > 0) {

            // Process each key in keystore record
            let keystoreDetails;
            _defaultGlobalSettings = keystoreDetails = response['hydra:member'][0].jSONValue;
            _defaultExclusionSettings = { 'recordUUID': response['hydra:member'][0].uuid, 'recordValue': {} };
            _defaultIOCTypeFieldMapping = { 'recordUUID': response['hydra:member'][0].uuid, 'recordValue': {} };
            Object.keys(keystoreDetails).forEach(function (indicatorType) {
              if (indicatorType === 'Indicator Type Mapping') {
                _defaultIOCTypeFieldMapping.recordValue = keystoreDetails[indicatorType];
              } else {
                let iocExclusionDetails = keystoreDetails[indicatorType]
                iocExclusionDetails.pattern = _getRegexPattern(indicatorType, _regexDict);
                _defaultExclusionSettings.recordValue[indicatorType] = iocExclusionDetails;
              }
            });
          }
        });
      });
    }


    function _handleTranslations() {
      let widgetData = {
        name: $scope.config.name,
        version: $scope.config.version
      };
      let widgetNameVersion = widgetUtilityService.getWidgetNameVersion(widgetData);
      if (widgetNameVersion) {
        widgetUtilityService.checkTranslationMode(widgetNameVersion).then(function () {
          $scope.viewWidgetVars = {
            // Create your translating static string variables here
            START_PAGE_WZ_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.START_PAGE_WZ_TITLE'),
            LABEL_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.LABEL_TITLE'),
            START_PAGE_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.START_PAGE_TITLE'),
            START_PAGE_DESCRIPTION: widgetUtilityService.translate('configureIndicatorExtraction.START_PAGE_DESCRIPTION'),
            START_PAGE_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.START_PAGE_BUTTON'),

            EXCLUDELIST_CONFIG_PAGE_WZ_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_WZ_TITLE'),
            EXCLUDELIST_CONFIG_PAGE_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_TITLE'),
            EXCLUDELIST_CONFIG_PAGE_DESCRIPTION: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_DESCRIPTION'),

            EXCLUDELIST_CONFIG_PAGE_SEARCH_PLACEHOLDER: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_SEARCH_PLACEHOLDER'),
            EXCLUDELIST_CONFIG_PAGE_SEARCH_RESULT_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_SEARCH_RESULT_LABEL'),

            EXCLUDELIST_CONFIG_PAGE_VALIDATE_IOC_ERROR_MSG: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_VALIDATE_IOC_ERROR_MSG'),

            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_LABEL'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_LAUNCH_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_LAUNCH_BUTTON'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_IMPORT_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_IMPORT_BUTTON'),


            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_UPLOAD_FAILED: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_UPLOAD_FAILED'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_SIZE_EXCEEDED: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_SIZE_EXCEEDED'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_TYPE_NOT_SUPPORTED: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_TYPE_NOT_SUPPORTED'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_UPLOADER_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_UPLOADER_LABEL'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_DROP_A_FILE: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_DROP_A_FILE'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_USE_STANDARD_UPLOADER: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_USE_STANDARD_UPLOADER'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_SIZE_SHOULD_NOT_EXCEED_25MB: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_SIZE_SHOULD_NOT_EXCEED_25MB'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_CONTENT_INVALID: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_CONTENT_INVALID'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_EXTENSION_INVALID: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_EXTENSION_INVALID'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_COMPLETED: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_COMPLETED'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_EXTRACT_DEFANGED_IOC: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_EXTRACT_DEFANGED_IOC'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_SUBMIT_ERROR: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_SUBMIT_ERROR'),

            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_LAUNCH_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_LAUNCH_BUTTON'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_FORM_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_FORM_LABEL'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_SELECT_INDICATOR_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_SELECT_INDICATOR_LABEL'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ALREADY_EXISTS_ERR_MSG: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ALREADY_EXISTS_ERR_MSG'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ALREADY_ADDED_ERR_MSG: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ALREADY_ADDED_ERR_MSG'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_EMPTY_ERR_MSG: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_EMPTY_ERR_MSG'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ENTER_IOC_PLACEHOLDER: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ENTER_IOC_PLACEHOLDER'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ENTER_REGEX_PLACEHOLDER: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ENTER_REGEX_PLACEHOLDER'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_SUBMIT_ERROR_MSG: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_SUBMIT_ERROR_MSG'),

            EXCLUDELIST_CONFIG_PAGE_EDIT_REGEX_ENTER_REGEX_PLACEHOLDER: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_EDIT_REGEX_ENTER_REGEX_PLACEHOLDER'),
            EXCLUDELIST_CONFIG_PAGE_EDIT_REGEX_TOOLTIP: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_EDIT_REGEX_TOOLTIP'),
            EXCLUDELIST_CONFIG_PAGE_EDIT_REGEX_ENTER_REGEX_ERROR_MSG: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_EDIT_REGEX_ENTER_REGEX_ERROR_MSG'),

            EXCLUDELIST_CONFIG_PAGE_EXCLUSION_SETTING_SUCCESS_MSG: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_EXCLUSION_SETTING_SUCCESS_MSG'),

            IOC_TYPE_MAPPING_PAGE_WZ_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_WZ_TITLE'),
            IOC_TYPE_MAPPING_PAGE_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_TITLE'),
            IOC_TYPE_MAPPING_PAGE_DESCRIPTION: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_DESCRIPTION'),
            IOC_TYPE_MAPPING_PAGE_FIELD_COLUMN_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_FIELD_COLUMN_TITLE'),
            IOC_TYPE_MAPPING_PAGE_TYPE_COLUMN_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_TYPE_COLUMN_TITLE'),
            IOC_TYPE_MAPPING_PAGE_FIELD_COLUMN_PLACEHOLDER: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_FIELD_COLUMN_PLACEHOLDER'),
            IOC_TYPE_MAPPING_PAGE_TYPE_COLUMN_PLACEHOLDER: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_TYPE_COLUMN_PLACEHOLDER'),
            IOC_TYPE_MAPPING_PAGE_FIELD_LOADING_ERROR: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_FIELD_LOADING_ERROR'),
            IOC_TYPE_MAPPING_PAGE_NOT_SET_LIST_ITEM: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_NOT_SET_LIST_ITEM'),
            IOC_TYPE_MAPPING_PAGE_FILETYPE_IOC_SETTING_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_FILETYPE_IOC_SETTING_LABEL'),
            IOC_TYPE_MAPPING_PAGE_ENABLE_CREATE_FILE_INDICATOR: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_ENABLE_CREATE_FILE_INDICATOR'),
            IOC_TYPE_MAPPING_PAGE_ENABLE_CREATE_FILE_INDICATOR_TOOLTIP: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_ENABLE_CREATE_FILE_INDICATOR_TOOLTIP'),
            IOC_TYPE_MAPPING_PAGE_ENABLE_ADD_COMMENT_FOR_EXCLUDED_FILES: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_ENABLE_ADD_COMMENT_FOR_EXCLUDED_FILES'),
            IOC_TYPE_MAPPING_PAGE_ENABLE_ADD_COMMENT_FOR_EXCLUDED_FILES_TOOLTIP: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_ENABLE_ADD_COMMENT_FOR_EXCLUDED_FILES_TOOLTIP'),
            IOC_TYPE_MAPPING_PAGE_SAVE_SUCCESS_MSG: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_SAVE_SUCCESS_MSG'),

            FINISH_PAGE_WZ_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_WZ_TITLE'),
            FINISH_PAGE_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_TITLE'),
            FINISH_PAGE_DESCRIPTION: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_DESCRIPTION'),
            FINISH_PAGE_EXCLUSION_SETTING_SUMMARY_HEADING: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_EXCLUSION_SETTING_SUMMARY_HEADING'),
            FINISH_PAGE_NO_EXCLUSION_CHANGE_MESSAGE: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_NO_EXCLUSION_CHANGE_MESSAGE'),
            FINISH_PAGE_FIELD_MAPPING_SUMMARY_HEADING: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_FIELD_MAPPING_SUMMARY_HEADING'),
            FINISH_PAGE_FIELD_TYPE_SUMMARY_MESSAGE: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_FIELD_TYPE_SUMMARY_MESSAGE'),
            FINISH_PAGE_CREATE_FILE_IOC_MESSAGE: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_CREATE_FILE_IOC_MESSAGE'),
            FINISH_PAGE_NO_FIELD_MAPPING_CHANGE_MESSAGE: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_NO_FIELD_MAPPING_CHANGE_MESSAGE'),
            FINISH_PAGE_SKIP_CREATE_FILE_IOC_MESSAGE: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_SKIP_CREATE_FILE_IOC_MESSAGE'),
            FINISH_PAGE_ADD_EXCLUDED_FILE_COMMENT_MESSAGE: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_ADD_EXCLUDED_FILE_COMMENT_MESSAGE'),
            FINISH_PAGE_SKIP_EXCLUDED_FILE_COMMENT_MESSAGE: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_PAGE_SKIP_EXCLUDED_FILE_COMMENT_MESSAGE'),

            BACK_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.BACK_BUTTON'),
            SAVE_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.SAVE_BUTTON'),
            SUBMIT_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.SUBMIT_BUTTON'),
            SKIP_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.SKIP_BUTTON'),
            CANCEL_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.CANCEL_BUTTON'),
            FINISH_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.FINISH_BUTTON')
          };
        });
      }
      else {
        $timeout(function () {
          cancel();
        }, 100)
      }
    }


    function init() {
      // To set value to be displayed on "Excludelist Settings" page
      _initExclusionSetting();
      // To handle backward compatibility for widget
      _handleTranslations();
    }

    init();
  }
})();
