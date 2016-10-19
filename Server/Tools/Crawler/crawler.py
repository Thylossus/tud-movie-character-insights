from bs4 import BeautifulSoup
from urllib.request import urlopen
import re

startUrl = "http://www.imsdb.com/all%20scripts/"

def getSoupForUrl(url):
	connection = urlopen(url)
	html = connection.read()
	soup = BeautifulSoup(html, 'html.parser')
	return soup

def pipeline():
	# get start page
	listSoup = getSoupForUrl(startUrl)

	# get all links to the movie description page
	h1 = listSoup.find('h1', text = re.compile('All Movie Scripts*'))
	movieLinks = h1.parent.find_all('p')

	for movie in movieLinks:
		print(movie.a['href'], end=' ')

		# open the movie description page
		descriptionUrl = 'http://www.imsdb.com' + movie.a['href']
		descriptionUrl = descriptionUrl.replace(' ', '%20')
		descriptionSoup = getSoupForUrl(descriptionUrl)

		# get the link to the script page
		paragraph = descriptionSoup.find('p', {'align':'center'})
		if not paragraph:
			print('-> Description Page has no link to Script')
			continue

		title = paragraph.text.strip()

		link = paragraph.a['href']
		if '.pdf' in link:
			print('-> Script is a PDF file')
			continue

		scriptUrl = 'http://www.imsdb.com' + paragraph.a['href']
		scriptUrl = scriptUrl.replace(' ','%20')

		# open the script page
		scriptSoup = getSoupForUrl(scriptUrl)

		# get the script
		script = scriptSoup.find('td', attrs={'class':'scrtext'})

		# find the most inner pre tag
		tmp = preTag = script
		while tmp:
			tmp = preTag.find('pre')
			if tmp:
				preTag = tmp

		# filter all script,head and empty b tags
		scriptTags = preTag.find_all('script')
		linkTags = preTag.find_all('link')
		headTags = preTag.find_all('head')
		removeTags = scriptTags + linkTags + headTags
		[tag.extract() for tag in removeTags]

		emptyTags = preTag.find_all('b')
		for tag in emptyTags:
			text = tag.text.strip()
			if not text:
				tag.extract()

		# create buffer and catch all prettity errors
		try:
			textBuffer = preTag.prettify().encode('UTF-8')

			# disard bad parsed movie scripts
			if len(textBuffer) < 5000:
				print('-> Buffer size too small, parsing failed')
			else:
				# write to output file
				filename = title + '.txt'
				fout = open(filename, 'wb')
				fout.write(textBuffer)
				fout.flush()
				fout.close()
		except:
			print('-> Prettify did not work', end=' ')

		# line end
		print('')

pipeline()
