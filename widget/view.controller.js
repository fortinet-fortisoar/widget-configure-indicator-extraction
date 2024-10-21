/* Copyright start
  MIT License
  Copyright (c) 2024 Fortinet Inc
  Copyright end */

'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('configureIndicatorExtraction200Ctrl', configureIndicatorExtraction200Ctrl);

  configureIndicatorExtraction200Ctrl.$inject = ['$scope', 'widgetUtilityService', '$rootScope', 'widgetBasePath', 'WizardHandler', 'iocExtractionConfigService', 'toaster', 'Upload', 'API'];

  function configureIndicatorExtraction200Ctrl($scope, widgetUtilityService, $rootScope, widgetBasePath, WizardHandler, iocExtractionConfigService, toaster, Upload, API) {
    // Initialization variables
    var _defaultGlobalSettings = {};
    var _defaultExclusionSettings = {};
    $scope.updatedExclusionSettings = {};
    $scope.defaultIOCTypeFieldMapping = {};
    $scope.updatedIOCTypeFieldMapping = {};
    $scope.defaultIOCTypeReGexMapping = {};
    $scope.updatedIOCTypeReGexMapping = {};
    $scope.initList = [];
    $scope.searchString = '';
    $scope.searchStatus = 'off';
    $scope.invalidIOCs = {}; // This dict holds invalid IOCs for various indicator types
    $scope.fileName = '';
    $scope.uploadedFileFlag = false;
    $scope.supportedFileTypes = '.csv,.txt,.pdf,.xls,.xlsx,.doc,.docx';
    $scope.loadingJob = false;
    $scope.defaultIOCTypeList = [];
    $scope.notYetEnteredIOCTypes = ['Add Custom Indicator Type'];
    $scope.selectedIndicatorType = { iocType: '', pattern: [] };
    $scope.addCustomIOCType = false;
    $scope.isSystemIOCType = true;
    $scope.iocTypeSelected = false;
    const maxFileSize = 25072682;
    const ignoredIndicatorTypes = ['results', 'unified_result', 'allowed_list_results'];
    var regexDict = {};
    var bulkImportIOCs = {};
    var indicatorTypePicklistUUID = '50ee5bfa-e18f-49ba-8af9-dcca25b0f9c0';
    var customIOCTypeList = [];

    // Theme and Image File Paths
    $scope.isLightTheme = $rootScope.theme.id === 'light';
    $scope.isSteelTheme = $rootScope.theme.id === 'steel';
    $scope.widgetCSS = widgetBasePath + 'widgetAssets/css/wizard-style.css';
    $scope.pageImages = {
      'startPageImage': $scope.isLightTheme ? widgetBasePath + 'images/ioc-extraction-start-light.png' : widgetBasePath + 'images/ioc-extraction-start-dark.png',
      'excludeIOCPageImage': $scope.isLightTheme ? widgetBasePath + 'images/ioc-extraction-exclusion-light.png' : widgetBasePath + 'images/ioc-extraction-exclusion-dark.png',
      'fieldMappingPageImage': $scope.isLightTheme ? widgetBasePath + 'images/ioc-extraction-field-map-light.png' : widgetBasePath + 'images/ioc-extraction-field-map-dark.png',
      'finishPageImage': widgetBasePath + 'images/ioc-extraction-finish-both.png'
    };

    // Wizard Functions
    $scope.moveNext = moveNext;
    $scope.moveBack = moveBack;

    // Support Functions
      // $scope._getRegexPattern = _getRegexPattern;
      // $scope._buildPayload = _buildPayload;

    // Exclusion List Functions
      // $scope._commitExclusionSettings = _commitExclusionSettings;
    $scope.validateIOC = validateIOC;

    // Search Functions
    $scope.setSearchStatus = setSearchStatus;
    $scope.updateSearchQuery = updateSearchQuery;

    // Bulk Import Functions
    $scope.uploadFiles = uploadFiles;
    $scope.setBulkImportFlags = setBulkImportFlags;
      // $scope._extractIOCsFromFile = _extractIOCsFromFile;
    $scope.importIOCsFromFile = importIOCsFromFile;

    // Add New Indicator Type Functions
    $scope.setAddNewIOCFlags = setAddNewIOCFlags;
      // $scope._getNotEnteredIOCTypes = _getNotEnteredIOCTypes;
    $scope.indicatorTypeChanged = indicatorTypeChanged;
    $scope.saveNewIOCType = saveNewIOCType;
      // $scope._commitIndicatorTypePicklist = _commitIndicatorTypePicklist;
      // $scope._addNewIocTypeToKeystore = _addNewIocTypeToKeystore;
      // $scope._addNewRegexToKeystore = _addNewRegexToKeystore;
      // $scope._commitRegexPatternChanges = _commitRegexPatternChanges;


    function _commitRegexPatternChanges() {
      $scope.defaultIOCTypeReGexMapping = $scope.updatedIOCTypeReGexMapping;
      let keyValue = $scope.defaultIOCTypeReGexMapping.recordValue;
      let uuid = $scope.defaultIOCTypeReGexMapping.recordUUID;
      iocExtractionConfigService.updateKeyStoreRecord(keyValue, uuid);
    }


    function _addNewRegexToKeystore(iocTypeName) {
      let regexKeyStoreTemplate = iocExtractionConfigService.constants().regexKeyStoreTemplate;
      regexKeyStoreTemplate['pattern_regx'] = $scope.selectedIndicatorType.pattern;
      regexKeyStoreTemplate['indicator_type'] = iocTypeName;
      $scope.updatedIOCTypeReGexMapping.recordValue.push(regexKeyStoreTemplate);
    }

    function _commitIndicatorTypePicklist(newIOCList) {
      iocExtractionConfigService.getPicklist(indicatorTypePicklistUUID).then(function (response) {
        let orderIndex = response.picklists.length;
        newIOCList.forEach(function(iocTypeName){
          let newPicklistItem = {'itemValue': iocTypeName, 'orderIndex': orderIndex };
          response.picklists.push(newPicklistItem);
          orderIndex = orderIndex + 1;
        });
        let payload = response;
        console.log(payload);
        iocExtractionConfigService.updatePicklist(payload, indicatorTypePicklistUUID);
        console.log(res);
      });
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
      Object.entries(bulkImportIOCs).forEach(function ([iocType, iocList]) {
        if (Array.isArray(iocList) && iocList.length > 0 && !ignoredIndicatorTypes.includes(iocType)) {
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
      setBulkImportFlags('bulkImportDisable');
      toaster.success({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_COMPLETED });
    }


    function _extractIOCsFromFile(fileIRI) {
      iocExtractionConfigService.getFileContent(fileIRI).then(function (fileContent) {
        if (!fileContent || !fileContent.data || !fileContent.data.extracted_text) {
          toaster.error({ body: $scope.viewWidgetVars.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_CONTENT_INVALID });
          $scope.enableSpinner = false;
          setBulkImportFlags('resetFileUpload');
          return;
        }
        iocExtractionConfigService.getArtifactsFromFile(fileContent.data.extracted_text).then(function (response) {
          if (response && response.data && response.data.results && response.data.results.length > 0) {
            bulkImportIOCs = response.data;
            $scope.bulkImportIOCExtractionDone = true;
            $scope.enableSpinner = false;
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

    function saveNewIOCType() {
      let iocTypeName = $scope.selectedIndicatorType.iocType;
      _addNewIocTypeToKeystore(iocTypeName);
      if (!$scope.isSystemIOCType) {
        _addNewRegexToKeystore(iocTypeName);
      }
      if($scope.addCustomIOCType){
        
        customIOCTypeList.push(iocTypeName);
      }
      _getNotEnteredIOCTypes();
      setAddNewIOCFlags('addNewIOCTypeDisabled');
    }


    function indicatorTypeChanged(iocType) {
      $scope.iocTypeSelected = true;
      if (iocType === 'Add Custom Indicator Type') {
        $scope.isSystemIOCType = false;
        $scope.addCustomIOCType = true;
        $scope.selectedIndicatorType = { iocType: '', pattern: [] };
      } else {
        $scope.addCustomIOCType = false;
        $scope.isSystemIOCType = true;
        $scope.selectedIndicatorType['pattern'] = _getRegexPattern(iocType, regexDict).join(',');
        if ($scope.selectedIndicatorType['pattern'].length === 0) {
          $scope.isSystemIOCType = false;
        }
      }
    }

    function setAddNewIOCFlags(flag) {
      if (flag === 'addNewIOCTypeEnabled') {
        $scope.addNewIndicatorType = true;
        $scope.bulkImportEnable = false;
      }
      if (flag === 'addNewIOCTypeDisabled') {
        $scope.addNewIndicatorType = false;
        $scope.selectedIndicatorType = { iocType: '', pattern: [] };
        $scope.addCustomIOCType = false;
        $scope.isSystemIOCType = true;
      }
    }

    function _getNotEnteredIOCTypes() {
      iocExtractionConfigService.getPicklist(indicatorTypePicklistUUID).then(function (response) {
        let alreadyEnteredIOCTypes = Object.keys($scope.updatedExclusionSettings.recordValue);
        let defaultIOCTypeList = response.picklists.map(function (item) {
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
        unCommonElements.push('Add Custom Indicator Type')
        $scope.notYetEnteredIOCTypes = unCommonElements;
      });
    }


    function setBulkImportFlags(flag) {
      const resetFileUpload = () => {
        $scope.bulkImportIOCExtractionDone = false;
        $scope.uploadedFileFlag = false;
        $scope.loadingJob = false;
        $scope.fileName = '';
      }
      if (flag === 'bulkImportEnable') {
        $scope.bulkImportIOCExtractionDone = false;
        $scope.bulkImportEnable = true;
        $scope.addNewIndicatorType = false;
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
      if (file.size < maxFileSize) {
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
            let fileIRI = fileMetadata['@id'];
            $scope.fileName = fileMetadata.filename;
            $scope.loadingJob = false;
            $scope.uploadedFileFlag = true;
            _extractIOCsFromFile(fileIRI);
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
              return iocValue.includes(searchStringValue);
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
      if (currentStepTitle === 'Start') {
        if (Object.keys($scope.updatedExclusionSettings).length === 0) {
          $scope.updatedExclusionSettings = angular.copy(_defaultExclusionSettings);
          $scope.updatedIOCTypeFieldMapping = angular.copy($scope.defaultIOCTypeFieldMapping);
          $scope.updatedIOCTypeReGexMapping = angular.copy($scope.defaultIOCTypeReGexMapping);
        }
        _getNotEnteredIOCTypes();
      }
      if (currentStepTitle === 'Excludelist Configuration') {
        if (param === 'save') {
          _commitExclusionSettings();
          _commitRegexPatternChanges();
          if (customIOCTypeList.length > 0){
            _commitIndicatorTypePicklist(customIOCTypeList);
            customIOCTypeList = [];
          }
        }
      }
      WizardHandler.wizard('configureIndicatorExtraction').next();
    }


    function moveBack() {
      WizardHandler.wizard('configureIndicatorExtraction').previous();
    }


    function _initExclusionSetting() {
      // Fetch regex mappings for different indicator types using Regex Keystore
      let keyName = 'sfsp-indicator-regex-mapping';
      let payload = _buildPayload(keyName, null, 'findKeyStore');
      iocExtractionConfigService.getKeyStoreRecord(payload, 'keys').then(function (response) {
        // Create a dictionary to map indicator types to regex patterns 
        if (response && response['hydra:member'] && response['hydra:member'].length > 0) {
          $scope.defaultIOCTypeReGexMapping = { 'recordUUID': response['hydra:member'][0].uuid, 'recordValue': response["hydra:member"][0].jSONValue };
          regexDict = $scope.defaultIOCTypeReGexMapping.recordValue.reduce(function (acc, item) {
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
            $scope.defaultIOCTypeFieldMapping = { 'recordUUID': response['hydra:member'][0].uuid, 'recordValue': {} };
            Object.keys(keystoreDetails).forEach(function (indicatorType) {
              if (indicatorType === 'Indicator Type Mapping') {
                $scope.defaultIOCTypeFieldMapping.recordValue = keystoreDetails[indicatorType];
              } else {
                let iocExclusionDetails = keystoreDetails[indicatorType]
                iocExclusionDetails.pattern = _getRegexPattern(indicatorType, regexDict);
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
            CANCEL_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.CANCEL_BUTTON'),

            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_UPLOAD_FAILED: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_UPLOAD_FAILED'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_SIZE_EXCEEDED: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_SIZE_EXCEEDED'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_TYPE_NOT_SUPPORTED: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_TYPE_NOT_SUPPORTED'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_UPLOADER_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_UPLOADER_LABEL'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_DROP_A_FILE: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_DROP_A_FILE'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_USE_STANDARD_UPLOADER: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_USE_STANDARD_UPLOADER'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_SIZE_SHOULD_NOT_EXCEED_25MB: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_SIZE_SHOULD_NOT_EXCEED_25MB'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_CONTENT_INVALID: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_FILE_CONTENT_INVALID'),
            EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_COMPLETED: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_BULK_IMPORT_COMPLETED'),

            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_LAUNCH_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_LAUNCH_BUTTON'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_FORM_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_FORM_LABEL'),
            EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_SELECT_INDICATOR_LABEL: widgetUtilityService.translate('configureIndicatorExtraction.EXCLUDELIST_CONFIG_PAGE_ADD_IOC_TYPE_SELECT_INDICATOR_LABEL'),

            BACK_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.BACK_BUTTON'),
            SAVE_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.SAVE_BUTTON'),
            SKIP_BUTTON: widgetUtilityService.translate('configureIndicatorExtraction.SKIP_BUTTON'),
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
