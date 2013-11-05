import web
class s_index:
	def GET(self):
		web.redirect("/static/index.html")

class s_api:
	def GET(self):
		return "this is my: "+str(globals()['schedule'].monitor('monitor1').myName())

class TinyWeb:
	def __init__(self):
		self.app = web.application(self.__urls(), globals(), True)

	def __urls(self):
		return (
			'/','s_index',
			'/api', 's_api'
		)

	def start(self):
		self.app.run()

if __name__ == "__main__": 
	w = TinyWeb()
	w.start()