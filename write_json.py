import json

data = {}
with open("lat_lng.txt", "r") as f:
	for w in f:
		item = w.replace('\n','').split(' - ')
		if item[1] != 'FAIL':
			lat_lng = item[1].split(',')
			data[item[0]] = {'lat': float(lat_lng[0]), 'lng': float(lat_lng[1])}
with open('locations.json', 'w') as outfile:
    json.dump(data, outfile)
