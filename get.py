import json
import requests


with open("locations.txt", "r") as f:
	for w in f:
		location = w.replace('\n','')
		request = 'https://maps.googleapis.com/maps/api/geocode/json?address={}&key=AIzaSyCwY8nkBC3-Kt3ali9-p00-WYOlmIhVJKE'.format(location)
		response = requests.get(request)
		json_data = json.loads(response.text)
		results = json_data['results']
		if len(results):
			geometry = results[0]['geometry']
			if 'bounds' in geometry:
				bounds = geometry['bounds']
				northeast = bounds['northeast']
				southwest = bounds['southwest']
				lat_average = (northeast['lat'] + southwest['lat']) / 2
				lng_average = (northeast['lng'] + southwest['lng']) / 2
				print('{} - {},{}'.format(location, lat_average, lng_average))
			elif 'location' in geometry:
				lat_lng = geometry['location']
				print('{} - {},{}'.format(location, lat_lng['lat'], lat_lng['lng']))
		else:
			print('{} - FAIL'.format(location))
