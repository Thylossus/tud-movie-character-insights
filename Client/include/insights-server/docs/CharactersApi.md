# InsightsServer.CharactersApi

All URIs are relative to *http://localhost:8080/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAllCharactersRequest**](CharactersApi.md#getAllCharactersRequest) | **GET** /characters | 
[**getCharacterRequest**](CharactersApi.md#getCharacterRequest) | **GET** /characters/{id} | All information regarding one movie character


<a name="getAllCharactersRequest"></a>
# **getAllCharactersRequest**
> [BasicCharacter] getAllCharactersRequest()



Return a list of all available movie characters 

### Example
```javascript
var InsightsServer = require('insights_server');

var apiInstance = new InsightsServer.CharactersApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.getAllCharactersRequest(callback);
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**[BasicCharacter]**](BasicCharacter.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="getCharacterRequest"></a>
# **getCharacterRequest**
> DetailedCharacter getCharacterRequest(id)

All information regarding one movie character

Returns all specific data available for one movie character: meta information and all available character insight information. 

### Example
```javascript
var InsightsServer = require('insights_server');

var apiInstance = new InsightsServer.CharactersApi();

var id = "id_example"; // String | The id of the movie character.


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.getCharacterRequest(id, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| The id of the movie character. | 

### Return type

[**DetailedCharacter**](DetailedCharacter.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

