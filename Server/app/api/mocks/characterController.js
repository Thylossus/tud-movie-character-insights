function getCharacter(req, res) {
  const id = req.swagger.params.id.value;
  console.log(`request for character with id: ${id}`);

  res.json({
    id: '1',
    name: '',
    description: {
      text: '',
      source: '',
    },
    picture: {
      path: '',
      source: '',
      license: '',
    },
    actor: '',
  });
}

module.exports = {
  getCharacter,
};
