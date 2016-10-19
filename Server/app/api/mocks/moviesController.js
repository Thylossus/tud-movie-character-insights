function getAllMovies(req, res) {
  console.log('request for all movies');

  res.json([
    {
      id: '1',
      name: 'Herr der Ringe',
    },
    {
      id: '2',
      name: 'Herr der Ringe 2',
    },
  ]);
}

function getMovie(req, res) {
  const id = req.swagger.params.id.value;
  console.log(`request for movie with id: ${id}`);

  res.json({
    id: '12314141',
    name: '',
    plot: '',
    year: 1990,
    poster: {
      path: '',
      source: '',
      license: '',
    },
    duration: 123,
    genres: ['fantasy', 'crimi'],
    director: 'test',
    characters: [{
      id: '',
      name: '',
      picture: {
        path: '',
        source: '',
        license: '',
      },
    }],
  });
}

module.exports = {
  getAllMovies,
  getMovie,
};
