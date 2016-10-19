# InsightsServer.MoviesApi

All URIs are relative to *http://localhost:8080/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAllMoviesRequest**](MoviesApi.md#getAllMoviesRequest) | **GET** /movies | Movie Scripts List
[**getMovieRequest**](MoviesApi.md#getMovieRequest) | **GET** /movies/{id} | All information regarding one movie


<a name="getAllMoviesRequest"></a>
# **getAllMoviesRequest**
> [BasicMovie] getAllMoviesRequest()

Movie Scripts List

Returns a list of all available movie scripts. 

### Example
```javascript
var InsightsServer = require('insights_server');

var apiInstance = new InsightsServer.MoviesApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.getAllMoviesRequest(callback);
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**[BasicMovie]**](BasicMovie.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="getMovieRequest"></a>
# **getMovieRequest**
> DetailedMovie getMovieRequest(id)

All information regarding one movie

Returns all specific data available for one movie: meta information and all available characters. 

### Example
```javascript
var InsightsServer = require('insights_server');

var apiInstance = new InsightsServer.MoviesApi();

var id = "id_example"; // String | The id of the movie.


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.getMovieRequest(id, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| The id of the movie. | 

### Return type

[**DetailedMovie**](DetailedMovie.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

