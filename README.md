# Live+Gov Inspection Front End

### Run on LG

```shell
while PORT=4001 DB=postgres://postgres:liveandgov@localhost/liveandgov_dev iojs server; do sleep 5; done
```

### Open SSH tunnel to remote PostgreSQL server

```shell
HOST=username@host make pg-sh-tunnel
```

* NB: you need to specify a $HOST environment variable.

### Update auth table

```shell
host="localhost -p 3333 -U postgres liveandgov_dev"
psql -t -E -h $host -c 'SELECT distinct user_id from trip order by user_id;' | while read -r id; do
  psql -E -h $host -c  "INSERT INTO auth (username, password) VALUES ('$id', '123');" # same same passwords
done
```

* TODO: auth should be a view, not a table
