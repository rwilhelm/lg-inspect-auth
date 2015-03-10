BASEDIR = .

IGNOREFILE = $(BASEDIR)/.gitignore
REMOVEFILES = `cat $(IGNOREFILE)` *bz2

NAME = lg-inspect
TARBALL = $(NAME)-`date '+%Y%m%d'`.tar.bz2

REMOTE_HOST = rene@141.26.69.238

DB = "localhost -p 3333 -U postgres liveandgov_dev"

install: npm bower

bower:
	@echo installing bower components
	@bower install

npm:
	@echo installing node modules
	@npm install ${ENVIRONMENT}

clean:
	@rm -rf $(REMOVEFILES)

tarball:
	@tar cjpf $(TARBALL) --exclude-from=$(IGNOREFILE) --exclude=$(TARBALL) $(BASEDIR)

deploy:
	@echo deploying to $(REMOTE_HOST)
	@rsync -av $(BASEDIR) $(REMOTE_HOST):$(NAME) --exclude-from=$(IGNOREFILE)

deploy-production:
	@echo deploying to $(REMOTE_HOST)
	@rsync -av $(BASEDIR) $(REMOTE_HOST):$(NAME)-production --exclude-from=$(IGNOREFILE)

pg-sh-tunnel:
	while true; do nc -z localhost 3333 >/dev/null || (ssh -NfL 3333:lg:5432 $(HOST); date); sleep 15; done

# only if tunnel
update-auth-table:
	psql -t -E -h $(DB) -c 'SELECT distinct user_id from trip order by user_id;' | while read -r id; do \
	  psql -E -h $(DB) -c  "INSERT INTO auth (username, password) VALUES ('$id', '123');" \ # same same passwords
	done

run-on-lg:
	PORT=4001 DB=postgres://postgres:liveandgov@localhost/liveandgov_dev iojs server
