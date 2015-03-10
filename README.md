# Live+Gov Inspection Front End

### Run on LG

```shell
make run-on-lg
```
or

```shell
while PORT=4001 DB=postgres://postgres:liveandgov@localhost/liveandgov_dev iojs server; do sleep 5; done
```

### Open SSH tunnel to remote PostgreSQL server

```shell
HOST=username@host make pg-sh-tunnel
```

or

```shell
HOST=username@host while true; do nc -z localhost 3333 >/dev/null || (ssh -NfL 3333:lg:5432 $HOST; date); sleep 15; done
```

* NB: you need to specify ssh credentials in the HOST environment variable.

### Update auth table

```shell
host="localhost -p 3333 -U postgres liveandgov_dev"
psql -t -E -h $host -c 'SELECT distinct user_id from trip order by user_id;' | while read -r id; do
  psql -E -h $host -c  "INSERT INTO auth (username, password) VALUES ('$id', '123');" # same same passwords
done
```

* TODO: auth should be a view, not a table

### Get a list of available users and their trip counts

```shell
psql -t -E -h localhost -p 3333 -U postgres liveandgov_dev -c 'SELECT distinct user_id from trip order by user_id;' | while read -r id; do trip_count=$(psql -t -E -h localhost -p 3333 -U postgres liveandgov_dev -c "SELECT COUNT(*) FROM (SELECT * FROM trip WHERE user_id = '$id') AS temp;"); echo $id $trip_count; done | sort -r -k2 | grep '.' | curl -F 'f:1=<-' ix.io
```

* Example result: http://ix.io/gP7

![Screenshot](http://cl.ly/image/2R2J2c3y2304/Screen%20Shot%202015-03-10%20at%2007.17.30.png)
