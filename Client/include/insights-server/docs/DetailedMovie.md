# InsightsServer.DetailedMovie

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Unique identifier representing a specific movie script. | [optional] 
**names** | [**Names**](Names.md) |  | [optional] 
**plot** | **String** | Movie plot | [optional] 
**year** | **Integer** | Year when the movie was published. | [optional] 
**picture** | [**Picture**](Picture.md) |  | [optional] 
**imdbScore** | **Number** | imdb movie score | [optional] 
**imdbRatingAmount** | **Integer** | amount of imdb ratings for this movie | [optional] 
**unifiedScore** | **Number** | combined score of imdbScore and imdbRatingAmount | [optional] 
**duration** | **Integer** | Duration of movie in minutes. | [optional] 
**genres** | **[String]** | array of genres | [optional] 
**director** | **String** | Name of movie director. | [optional] 
**characters** | [**[BasicCharacter]**](BasicCharacter.md) |  | [optional] 


