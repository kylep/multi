title: Working with JSON SQL values in Python
summary: Using raw SQL queries to manage JSON values in databases
slug: python-raw-sql-json
category: development
tags: python
date: 2019-09-05
modified: 2019-09-05
status: published
image: python.png
thumbnail: python-thumb.png


Often I need to operate on a huge JSON string that's saved in a MaraiDB
database. Here's how I do that.

It needs to be said that raw SQL queries like this are generally a bad idea
compared to something like [SQLAlchemy's ORM](https://docs.sqlalchemy.org/en/13/orm/).
Having said that, this example is way smaller and more portable.

The way this works is you open up an interactive python session, ideally in
a virtualenv. Set the variable values at the top. Run the two functions as
needed. In another window/pane, edit the JSON files.

Another option is to use `jq` with interactive MySQL commands. I'm not covering
that in this post, though.


# Environment setup

This is best done in a venv if `mysql-connector` doesn't need to be installed
on the base system.

```bash
pip install mysql-connector
```


# The code

It's not a bad idea to write this into a parameterized CLI or whatever.
I just run this in an interactive python shell in a dedicated window/pane.

```python
import json
import mysql.connector as mariadb

# Fill in the blanks
db_host= ''  # IP address
db_port = 3306
db_username = ''
db_password = ''
db_name = ''
table_name = ''
column_name = ''
where = ''  # (optional) where = 'WHERE `x` == 1'


def save_to_file(filename):
    """Read the json data from the database, save to filename"""
    conn = mariadb.connect(host=db_host, port=db_port, user=db_username,
                           password=db_password, database=db_name)
    cursor = conn.cursor()
    read_query = 'SELECT {} from {}{}'.format(column_name, table_name, where)
    cursor.execute(read_query)
    data = cursor.fetchone()[0]
    conn.close()
    jdata = json.dumps(json.loads(data), indent=4, sort_keys=True)
    with open(filename, 'w+') as out_file:
        out_file.write(jdata)
    print('done')


def update_from_file(filename):
    """Read data from filename, write to database"""
    with open(filename) as json_file:
        jdata = json.load(json_file)
    data = json.dumps(jdata)
    conn = mariadb.connect(host=db_host, port=db_port, user=db_username,
                           password=db_password, database=db_name)
    cursor = conn.cursor()
    update_query = "UPDATE {} SET {} = '{}'{}".format(table_name, column_name,
                                                      data, where)
    cursor.execute(update_query)
    conn.commit()
    conn.close()
    print('done')
```

# Usage

From an interactive python terminal, paste the above script in.

Then to save the file, run something like:

```python
save_to_file(filename='/home/kyle/sqldata.json')
```

Then you can update the file using an editor `vi /home/kyle/sqldata.json`.

Back in the Python terminal, you can then push the data back up.

```python
update_from_file(filename='/home/kyle/sqldata.json')
```
