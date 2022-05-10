rem #!/bin/bash
rem # Absolute path to this script, e.g. /home/user/bin/foo.sh
rem SCRIPT=$(readlink -f "$0")
rem # Absolute path this script is in, thus /home/user/bin
rem SCRIPTPATH=$(dirname "$SCRIPT")
rem cd $SCRIPTPATH
rem npm start

cd %~dp0
npm start