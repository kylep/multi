title: Python Reference Page
summary: Useful code patterns, notes, and ideas about python code
slug: python
category: reference pages
tags: python
date: 2019-09-04
modified: 2019-09-26
status: published
image: python.png
thumbnail: python-thumb.png


**This is a Reference Page:** Reference pages are collections of short bits
of information that are useful to look up but not long or interesting enough to
justify having their own dedicated post.

This reference page contains python-related mini-guides and minor posts.

---

[TOC]

---


# Pylint Ignore Comments

I can never remember the syntax to ignore certain Pylint warnings. Yeah you can
turn them off everywhere but usually I just want to ignore a certain occurrence.

```python
# - This file is a mess and I don't want pylint here:
# pylint: disable-all

# - troublesome import not being found:
# pylint: disable=import-error

# - redefined-builtin (W0622):
# pylint: disable=W0622

# - too-many-public-methods (R0904):
# pylint: disable=R0903

# - too-many-arguments (R0913):
# pylint: disable-msg=R0913

# - too-many-locals (R0914)
# pylint: disable=R0914

# - Invalid constant name:
# pylint: disable=C0103

# - Catching too general exception:
# pylint: disable=W0703

# - Using python3 compatible print statement makes python2 linter mad
# pylint: disable=superfluous-parens

# - Ignore too-long line (this needs both the pylint command and the trailing no-qa)
# pylint: disable=line-too-long
binaryValue = b'QVdTOmV5SndZWGxzYjJGa0lqb2lVSFkwWXpKeFNEaHZXVkkxVmtwRmVXdFhXamhKUVRGcGNFWk1kelJKZEV0V1UwSk9'  # noqa: E50

# - Wrong Import Position (Required when putting python version check up top)
# flake8: noqa=402
# pylint: disable=wrong-import-position
```


## Turn off Linting for now

In VIM, run:

```
:ALEToggle
```

# Get an object from list of objects where the object property has value x

## A subset list is expected: list comprehension

See [Section 5.1.3 - List comprehension](https://docs.python.org/3/tutorial/datastructures.html)

```python
# This will return a list of objects whith a value
[obj for obj in haystack_list if obj.value == search]

# Example of list comprehension to get the even numbers in a list
nums = [1, 2, 3, 4, 5, 6, 7, 8]
even_nums = [num for num in nums if num % 2 == 0]
```


## Get one match: next() w/ generator expression

The `next()` method will return the first element found in an iterable.

See [PEP 289 - Generator expressions](https://www.python.org/dev/peps/pep-0289/)

```python
# Raises a StopIteration exception if no match is found
needle = next((obj for obj in haystack_list if obj.value == value))

# To return a value instead of raising an exception, pass a second argument
needle = next((obj for obj in haystack_list if obj.value == search), None)

# Example of what Next is really doing. This returns 1.
next(iter([1,2,3]))
```


---


# Iterate through dictionary

```python
ex_dict = {'a': 1, 'b': 2, 'c': 3}
for key in ex_dict:
    print(key)
    print(ext_dict[key]) # value
```

This works because `ex_dict.keys() == list(ex_dict)`


---
# Print JSON nicely in ASCII (no unicode 'u' prefix)

This is like using [pprint](https://docs.python.org/3/library/pprint.html) on
the JSON object but without the unicode prefixes.

```python
data = ... # the json string
jdata = json.dumps(json.loads(data),  indent=4, sort_keys=True)
print(jdata)
```


---


# Replace a string in a file
Though honestly, [sed](https://www.geeksforgeeks.org/sed-command-in-linux-unix-with-examples/)
is usually a better option. Or if there are a lot of values, I like to use a
jinja template.

```python
file_path = '/home/user/example_file'
find_str = 'REPLACE_THIS'
replace_str = 'WITH_THIS'

# Open the file to read the value
with open(file_path, 'r') as read_file:
    file_content = read_file.read()

# Replace the string
file_content = file_content.replace(find_str, replace_str)

# Write the file
with open(file_path, 'w') as write_file:
    write_file.write(replaced_content)
```


---


# Get environment variable

I mostly use this with [Dockerfile ENV values](https://docs.docker.com/engine/reference/builder/).

```python
import os

environment_var_name = 'MY_ENV_VAR'
environment_var_vlue os.environ[environment_var_name]
```


---


# Use Jinja2 for templating

I use this for config files, like [how Ansible does it](https://docs.ansible.com/ansible/latest/user_guide/playbooks_templating.html).

```python
from jinja2 import Template

replacements = {'USERNAME': 'kyle', 'PASSWORD': 'example'}
template_text = 'connection = mysql://{{USERNAME}}:{{PASSWORD}}@127.0.0.1'
template = Template(template_text)
replaced_text = template.render(**replacements)
```

## Jinja2 templating with files
Same idea as above but it reads a .j2 file as input and writes it to a config
file. Can combine this nicely with environment variables to write config files
as part of a Docker start script.

```python
from jinja2 import Template

def apply_template(jinja2_file, output_file, replacements):
    """Replace the replacements values in jinja2_file, write to output_file"""
    with open(jinja2_file, 'r') as j2_file:
        j2_text = j2_file.read()
    template = Template(j2_text)
    replaced_text = template.render(**replacements)
    with open(output_file, 'w+') as write_file:
        write_file.write(replaced_text)

```


---


# Execute SQL query against MySQL or MariaDB

```python
import mysql.connector as mariadb

conn = mariadb.connect(host=db_host, port=db_port, user=db_username,
                           password=db_password, database=db_name)
cursor = conn.cursor()
cursor.execute(sql_query)
conn.commit() # if it was a write action
conn.close()
```


---


# Read from std in (bash pipe)
For instance I have a file named x that has a big string where I want to
replace commas with spaces. Sed works but I can never remember the syntax.

```python
cat x | python -c "import sys; print(sys.stdin.read())"

# Example of using python instead of sed to replace , with spaces
cat x | python -c "import sys; print(sys.stdin.read().replace(',',' '))"

# You can use this in fun ways like combining it with bash loops
cat x | python -c \
  "import sys; print(sys.stdin.read().replace(',','\n'))" | while read line; do
  echo $line
done
```


---


# Custom Exceptions

```python
class MyCustomException(Error):
    pass
```



---


# Can't run pip after updating

So you ran into a problem because ubuntu ships an ancient version of pip, and
some dependency package like `subprocess32` is breaking your install. A forum
post says you should update pip.

```bash
pip install -U pip
```

Except now pip won't run at all.

```bash
pip install python-openstackclient
Traceback (most recent call last):
  File "/usr/bin/pip", line 9, in <module>
    from pip import main
ImportError: cannot import name main
```

I think maybe the pip executable file moved after the update.
To fix it:

```bash
hash -r pip
```

Now pip works again.

As an aside, if `subprocess32` really was your problem, updating pip didn't
help. For some reason you have to use apt to install `python-subprocess32`.
