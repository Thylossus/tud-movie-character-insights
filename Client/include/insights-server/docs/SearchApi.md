# InsightsServer.SearchApi

All URIs are relative to *http://localhost:8080/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**search**](SearchApi.md#search) | **POST** /search | Search for similar characters


<a name="search"></a>
# **search**
> SearchResult search(search)

Search for similar characters

Uses an uploaded insights object to find the the most similar characters in specific dimensions

### Example
```javascript
var InsightsServer = require('insights_server');

var apiInstance = new InsightsServer.SearchApi();

var search = new InsightsServer.Search(); // Search | Search object


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.search(search, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **search** | [**Search**](Search.md)| Search object | 

### Return type

[**SearchResult**](SearchResult.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

