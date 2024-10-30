/* Copyright start
  MIT License
  Copyright (c) 2024 Fortinet Inc
  Copyright end */

'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('configureIndicatorExtraction200Ctrl', configureIndicatorExtraction200Ctrl);

  configureIndicatorExtraction200Ctrl.$inject = ['$scope', 'widgetUtilityService', '$rootScope', 'widgetBasePath', 'WizardHandler', 'iocExtractionConfigService', 'toaster', 'Upload', 'API', 'Entity'];

  function configureIndicatorExtraction200Ctrl($scope, widgetUtilityService, $rootScope, widgetBasePath, WizardHandler, iocExtractionConfigService, toaster, Upload, API, Entity) {
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
    $scope.searchString = '';
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
    $scope.selectedIndicatorType = { iocType: '', pattern: [], dropDownValue: '' };
    $scope.addCustomIOCType = false;
    $scope.duplicateIOCTypeFlag = false;
    $scope.setAddNewIOCFlags = setAddNewIOCFlags;
    $scope.indicatorTypeChanged = indicatorTypeChanged;
    $scope.saveNewIOCType = saveNewIOCType;
    $scope.clearDuplicateIOCErrorMsg = clearDuplicateIOCErrorMsg;

    // Theme and Image File Paths
    $scope.widgetCSS = widgetBasePath + 'widgetAssets/css/wizard-style.css'
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
    _loadAttributes();
    $scope.indicatorTypeMappingDict = {
      "url": "URL",
      "domain": "Domain",
      "dLLName": "",
      "emailCc": "Email Address",
      "emailTo": "Email Address",
      "urlFull": "URL",
      "fileHash": "FileHash-MD5",
      "filehash": "FileHash-MD5",
      "reporter": "Email Address",
      "services": "Process",
      "sourceIP": "IP Address"
    }


    function _loadAttributes() {
      var entity = new Entity($scope.selectedModule.toLowerCase());
      entity.loadFields().then(function () {
        $scope.fields = entity.getFormFields();

        // $scope.fieldsArray = _.values($scope.fields);
        // console.log($scope.fieldsArray);
      });
    }


    function updateDefangSelection(status) {
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
      _defaultIOCTypeReGexMapping = _updatedIOCTypeReGexMapping;
      let keyValue = _defaultIOCTypeReGexMapping.recordValue;
      let uuid = _defaultIOCTypeReGexMapping.recordUUID;
      iocExtractionConfigService.updateKeyStoreRecord(keyValue, uuid);
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
      keyStoreTemplate['pattern'].push($scope.selectedIndicatorType.pattern);
      if ($scope.addCustomIOCType) {
        keyStoreTemplate['system'] = false;
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
      if (iocType === 'Add Custom Indicator Type') {
        $scope.isRegexAvailable = false;
        $scope.addCustomIOCType = true;
        $scope.selectedIndicatorType = { iocType: '', pattern: [], dropDownValue: 'Add Custom Indicator Type' };
      } else {
        $scope.addCustomIOCType = false;
        $scope.selectedIndicatorType['iocType'] = iocType;
        $scope.selectedIndicatorType['pattern'] = _getRegexPattern(iocType, _regexDict).join(',');
        $scope.isRegexAvailable = true;
        if ($scope.selectedIndicatorType['pattern'].length === 0) {
          $scope.isRegexAvailable = false;
        }
        $scope.duplicateIOCTypeFlag = false;
      }
    }


    function setAddNewIOCFlags(flag) {
      if (flag === 'addNewIOCTypeEnabled') {
        $scope.addNewIndicatorType = true;
        $scope.bulkImportEnable = false;
        $scope.isRegexAvailable = true;
        $scope.iocTypeSelected = false;
      }
      if (flag === 'addNewIOCTypeDisabled') {
        $scope.addNewIndicatorType = false;
        $scope.selectedIndicatorType = { iocType: '', pattern: [], dropDownValue: '' };
        $scope.addCustomIOCType = false;
        $scope.isRegexAvailable = true;
        $scope.iocTypeSelected = false;
        $scope.duplicateIOCTypeFlag = false;
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
      // unCommonElements.push('Add Custom Indicator Type');
      $scope.notYetEnteredIOCTypes = unCommonElements;

      return [...alreadyEnteredIOCTypes, ...defaultIOCTypeList];
    }


    function setBulkImportFlags(flag) {
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
        $scope.addNewIndicatorType = false;
        $scope.extractDefangedIOCsFlag = false;
        $scope.bulkImportInProgress = false;
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
      $scope.searchString = searchStringValue;
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
      $scope.searchStatus = status;
      if (status === 'off') {
        $timeout(function () {
          $scope.searchString = '';
        }, 0);
      }
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

        $scope.isInvalidIOCsNotEmpty = function () {
          return Object.keys($scope.invalidIOCs).length > 0;
        };
      }
    }


    function _commitExclusionSettings() {
      Object.keys($scope.updatedExclusionSettings.recordValue).forEach(function (item) {
        _defaultGlobalSettings[item] = $scope.updatedExclusionSettings.recordValue[item];
      });
      let keyValue = _defaultGlobalSettings;
      let uuid = $scope.updatedExclusionSettings.recordUUID;
      iocExtractionConfigService.updateKeyStoreRecord(keyValue, uuid);
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
      }
      if (currentStepTitle === $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_WZ_TITLE) {
        if (param === 'save') {
          _commitExclusionSettings();
          _commitRegexPatternChanges();
          if (_customIOCTypeList.length > 0) {
            _commitIndicatorTypePicklist(_customIOCTypeList);
            _customIOCTypeList = [];
          }
        }
      }
      WizardHandler.wizard('configureIndicatorExtraction').next();
    }


    function moveBack() {
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
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_COMPLETED: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_COMPLETED'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_EXTRACT_DEFANGED_IOC: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_EXTRACT_DEFANGED_IOC'),

            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_LAUNCH_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_LAUNCH_BUTTON'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_FORM_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_FORM_LABEL'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_SELECT_INDICATOR_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_SELECT_INDICATOR_LABEL'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ALREADY_EXISTS_ERR_MSG: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ALREADY_EXISTS_ERR_MSG'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ALREADY_ADDED_ERR_MSG: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_ALREADY_ADDED_ERR_MSG'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_EMPTY_ERR_MSG: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_EMPTY_ERR_MSG'),

            IOC_TYPE_MAPPING_PAGE_WZ_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_WZ_TITLE'),
            IOC_TYPE_MAPPING_PAGE_TITLE: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_TITLE'),
            IOC_TYPE_MAPPING_PAGE_DESCRIPTION: widgetUtilityService.translate('configureIndicatorExtraction.IOC_TYPE_MAPPING_PAGE_DESCRIPTION'),

            BACK_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.BACK_BUTTON'),
            SAVE_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.SAVE_BUTTON'),
            SKIP_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.SKIP_BUTTON'),
            CANCEL_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.CANCEL_BUTTON'),
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
