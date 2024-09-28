/* Copyright start
  MIT License
  Copyright (c) 2024 Fortinet Inc
  Copyright end */


'use strict';

(function () {
  angular
    .module('cybersponse')
    .factory('iocExtractionConfigService', iocExtractionConfigService);

  iocExtractionConfigService.$inject = ['$q', 'API', '$resource', 'toaster', 'connectorService'];

  function iocExtractionConfigService($q, API, $resource, toaster, connectorService) {

    var service = {
      constants: constants,
      createOrUpdateKeyStore: createOrUpdateKeyStore,
      getKeyStoreRecord: getKeyStoreRecord,
      updateKeyStoreRecord: updateKeyStoreRecord,
      executeConnectorOperation: executeConnectorOperation,
      getIndicatorRegex: getIndicatorRegex
    }
    return service;

    function constants() {
      return {
        createKeyStorePayload: {
          "key": "",
          "notes": "",
          "__replace": true,
          "jSONValue": [],
          "recordTags": [
            API.API_3_BASE + 'tags/ExcludeListIOCs'
          ],
          "__fieldsToUpdate": [
            "jSONValue"
          ]
        },
        findKeyStorePayload: {
          "sort": [
            {
              "field": "id",
              "direction": "ASC",
              "_fieldName": "id"
            }
          ],
          "limit": 30,
          "logic": "AND",
          "filters": [
            {
              "field": "key",
              "operator": "like",
              "_operator": "like",
              "value": "",
              "type": "primitive"
            }
          ],
          "__selectFields": [
            "key",
            "jSONValue"
          ]
        }
      }
    }


    function getIndicatorRegex() {
      return executeConnectorOperation('cyops_utilities', 'get_regx_of_indicators', null, []);
    }


    function executeConnectorOperation(connector_name, connector_action, userLoginId, payload) {
      return $resource(API.INTEGRATIONS + 'connectors/?name=' + connector_name)
        .get()
        .$promise
        .then(function (connectorMetaDataForVersion) {
          return connectorService.executeConnectorAction(connector_name, connectorMetaDataForVersion.data[0].version, connector_action, userLoginId, payload);
        })
        .catch(function (error) {
          console.error('Error:', error);
          throw error; // Rethrow the error to be handled by the caller
        });
    }


    function createOrUpdateKeyStore(queryObject, module) {
      var defer = $q.defer();
      var url = API.API_3_BASE + 'upsert/' + module;
      $resource(url).save(queryObject, function (response) {
        defer.resolve(response);
      }, function (err) {
        defer.reject(err);
      })
      return defer.promise;
    }


    function getKeyStoreRecord(queryObject, module) {
      var defer = $q.defer();
      var url = API.QUERY + module;
      $resource(url).save(queryObject, function (response) {
        defer.resolve(response);
      }, function (err) {
        defer.reject(err);
      })
      return defer.promise;
    }

    function updateKeyStoreRecord(keyStoreValue, recordUUID) {
      $resource(API.API_3_BASE + 'keys' + '/' + recordUUID, null, {
        'update': {
          method: 'PUT'
        }
      }).update({ 'jSONValue': keyStoreValue }).$promise.then(function (response) {
        return response;
      }).catch(function (err) {
        toaster.error({
          body: 'Global Setting Configuration Failed.'
        });
        return $q.reject(err);
      });
    }
  }
})();