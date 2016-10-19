# InsightsServer.QuizApi

All URIs are relative to *http://localhost:8080/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getQuiz**](QuizApi.md#getQuiz) | **POST** /quiz/question | Informations for a new quiz
[**postResults**](QuizApi.md#postResults) | **POST** /quiz/result | Result for a finished quiz


<a name="getQuiz"></a>
# **getQuiz**
> Question getQuiz(quizRequest)

Informations for a new quiz

Returns a new quiz for the specified movies and character

### Example
```javascript
var InsightsServer = require('insights_server');

var apiInstance = new InsightsServer.QuizApi();

var quizRequest = new InsightsServer.QuizRequest(); // QuizRequest | The movies for which the quiz should be generated


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.getQuiz(quizRequest, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **quizRequest** | [**QuizRequest**](QuizRequest.md)| The movies for which the quiz should be generated | 

### Return type

[**Question**](Question.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="postResults"></a>
# **postResults**
> Error postResults(quizResult)

Result for a finished quiz

Contains the result for a finished quiz with all information about items

### Example
```javascript
var InsightsServer = require('insights_server');

var apiInstance = new InsightsServer.QuizApi();

var quizResult = new InsightsServer.QuizResult(); // QuizResult | The result as an object


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.postResults(quizResult, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **quizResult** | [**QuizResult**](QuizResult.md)| The result as an object | 

### Return type

[**Error**](Error.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

