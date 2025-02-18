dev:
    node dev.js

build:
    node convert_md.js

sync:
    rsync -avz ./htdocs/ $ADDRESS:/var/www/htdocs/