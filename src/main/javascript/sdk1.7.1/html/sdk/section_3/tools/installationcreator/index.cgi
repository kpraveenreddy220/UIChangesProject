!/bin/bash

LOG=/tmp/sdk.log

BuildArch="NoArch"
show_spec_form() {
  Summary=${Summary//+/ }
  Vendor=${Vendor//+/ }
  cat << EOF
   $application, $Version, $Release, $Summary, $Description, $Vendor, $1, $2
EOF
}

#
# NAME
#	step_3
#
# SYNOPSIS
#	step_3
#
# DESCRIPTION
#	This function displays a copy of the SPEC file on the terminal and
#	asks the user to confirm if it is OK to continue to generate the
#	.RPM file.
#
# RETURNS
#
step_3() {
  Summary="${Summary//+/ }"
  Vendor="${Vendor//+/ }"
  local url_encoded="${Description//+/ }"
  Desc=`printf '%b' "${url_encoded//%/\\x}"`

  echo "<pre>"

#  SPEC_TEMP=/tmp/rpm-spec.txt
  SPEC_DIR=$topdir/SPECS
  SPEC_FILE=$SPEC_DIR/$application-$Version-$Release.spec

  cat << EOF >$SPEC_FILE
 
Name:        $application
Version:     $Version
Release:     $Release
Group:       $Group
License:     Proprietary
Vendor:      $Vendor
Summary:     $Summary
AutoReqProv: no
BuildArch:   $BuildArch
Prefix:      /home/$application

%Description
$Desc

%install

%files
%defattr(-,u_app_$application,gr_app_$application)
/home/$application/*
EOF

if [[ -e "/home/$application/.ssh" ]] ; then
  echo "%exclude /home/$application/.ssh" >>$SPEC_FILE
fi
if [[ -e "/home/$application/.ash_history" ]] ; then
  echo "%exclude /home/$application/.ash_history" >>$SPEC_FILE
fi

  #
  # Save the current version in rpm-spec so I can use this for
  # default values the next time I need to create an RPM for
  # this application
  #
  sync
  echo "installationcreator: Copy from $SPEC_FILE to /home/sdk/files/applications/$application/rpm-spec.txt" >>$LOG
  cp $SPEC_FILE /home/sdk/files/applications/$application/rpm-spec.txt

  cat $SPEC_FILE
  echo "</pre>"
  rm -rf /home/sdk/files/tmp/$application/BUILDROOT/
  mkdir -p /home/sdk/files/tmp/$application/BUILDROOT/home/
  ln -s /home/$application /home/sdk/files/tmp/$application/BUILDROOT/home/$application
  cat << EOF
EOF
}



#
# NAME
#	step_4
#
# SYNOPSIS
#	step_4
#
# DESCRIPTION
#	The user has confirmed that everything looks OK and I'll
#	proceed to call rpmbuild to actually make the .RPM file.
#
#	If the file is built OK, I'll also generate a
#	manifest.xml file and put links on the page to allow the
#	user to download both the manifest.xml and the .RPM file.
#
# RETURNS
#
step_4() {

  BUILD_ROOT=$topdir
  NVR=$application-$Version-$Release
  RPMS_FILE=$BUILD_ROOT/RPMS/$BuildArch/$NVR.$BuildArch.rpm
  MANI_FILE=$BUILD_ROOT/manifest.xml

#echo "BUILD_ROOT = '$BUILD_ROOT'<br>"
#echo "RPMS_FILE = '$RPMS_FILE'<br>"
#echo "Building $BUILD_ROOT/SPECS/$NVR.spec<br>"

  #
  # Now run rpmbuild which places the output into BUILD_ROOT/RPMS
  #
  cd $BUILD_ROOT/SPECS
  rpmbuild -bb $BUILD_ROOT/SPECS/$NVR.spec  --buildroot /home/sdk/files/tmp/$application/BUILDROOT/ --define "_topdir /home/sdk/files/tmp/$application" >/dev/null 2>&1

  if [[ -e "$RPMS_FILE" ]] ; then

    base64_sha256sum=`sha256sum $RPMS_FILE | cut -f1 -d\  | base64 | tr -d '\n'`
    sha256sum=`sha256sum $RPMS_FILE | cut -f1 -d\ `
    Date=`date -Iseconds | cut -f1 -d+`
    cat << EOF >$MANI_FILE
<?xml version="1.0" encoding="UTF-8"?>
<swpack xmlns="http://www.nbsps.com/xml/ns/SwPackManifest_1_0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <id>
    <name>$application</name>
    <version>$Version-$Release</version>
  </id>

  <issuer>$Vendor</issuer>
  <releaseDate>$Date</releaseDate>

  <files>
    <file>
      <name>$NVR.NoArch.rpm</name>
      <sha256>$sha256sum</sha256>
    </file>
  </files>
</swpack>
EOF

    echo "Click <a href='/cgi-bin/sdk/saveAs.cgi?file=$application/RPMS/NoArch/$NVR.NoArch.rpm'>$NVR.rpm</a> to download the RPM file<p>"
    echo "and <a href='/cgi-bin/sdk/saveAs.cgi?file=$application/manifest.xml'>manifest.xml</a> to"
    echo "download the manifest file<p>"
    echo "<!-- Running command from directory $BUILD_ROOT/SPECS -->"
    echo "<!-- Command was rpmbuild -bb $BUILD_ROOT/SPECS/$NVR.spec --buildroot /home/sdk/files/tmp/$application/BUILDROOT/ --define "_topdir /home/sdk/files/tmp/$application" -->"
  else
    echo "<h2 id="par-1">ERROR</h2>"
    echo "Build error, $RPMS_FILE file was not generated<br>"
    echo "Running command from directory <b><i>$BUILD_ROOT/SPECS</i></b><br>"
    echo "Command was <b><i>rpmbuild -bb $BUILD_ROOT/SPECS/$NVR.spec --buildroot /home/sdk/files/tmp/$application/BUILDROOT/ --define "_topdir /home/sdk/files/tmp/$application"</i></b><br>"
  fi
cat << EOF
EOF
}


#
# MAINLINE
# ========
#
  if [ "$QUERY_STRING" ] ; then
    saveIFS=$IFS
    IFS=\&
    set $QUERY_STRING
    while [ "$1" ] ; do
      left=${1%=*}
      right=${1#*=}
      eval $left=$right
      shift
    done
    IFS=$saveIFS
  fi
  application=${application%/}
  topdir=/home/sdk/files/tmp/$application
  if [[ "$step" == "4" && "$selection" == "Go+back" ]] ; then
    step=1
  fi

  echo "Content-type: text/html"
  echo ""
  cat << EOF

EOF

  #
  # If the parameter "application" is not available, then display the main page
  # and ask the user to select the application name
  #

  if [[ $step -eq 1 ]] ; then
    #
    # This is the step to create a spec file.  We now have the application
    # name in variable $application
    # If this is the first time to create an rpm for this $application then
    #   create the /home/sdk/files/applications/$application directory.
    # end if
    #
    if [[ ! -d "/home/sdk/files/applications" ]] ; then
      mkdir /home/sdk/files/applications
    fi
    if [[ ! -d "/home/sdk/files/applications/$application" ]] ; then
      mkdir /home/sdk/files/applications/$application
    fi

    if [[ ! -d "/home/sdk/files/tmp" ]] ; then
      mkdir /home/sdk/files/tmp
    fi

#    if [[ ! -d "/home/sdk/files/tmp/$application" ]] ; then
#      mkdir /home/sdk/files/tmp/$application
#    fi

#    if [[ ! -d "/home/sdk/files/tmp/$application/app-files" ]] ; then
#      mkdir /home/sdk/files/tmp/$application/app-files
#      mkdir /home/sdk/files/tmp/$application/app-files/home
#    fi

    rm -rf /home/sdk/files/tmp/$application
    mkdir /home/sdk/files/tmp/$application
    mkdir /home/sdk/files/tmp/$application/app-files
    mkdir /home/sdk/files/tmp/$application/app-files/home
    
    for rpmdir in BUILD RPMS SPECS ; do
      if [[ ! -d "$topdir/$rpmdir" ]] ; then
        mkdir "$topdir/$rpmdir"
      fi
    done
    chmod -R g+rw /home/sdk/files/tmp

    #
    # if there is data available from a
    # previous spec file for this application in the
    # /home/sdk/files/$application/rpm-spec.txt file then
    #   read in default values for the Name, Version, Release etc.. from this
    #   file and use these to prefil values in the form
    # end if
    #
    specpath=/home/sdk/files/applications/$application/rpm-spec.txt
    if [[ -e "$specpath" ]] ; then
      #
      # Read in the variables from the rpm-spec.txt file
      #
      Name=`awk '/Name:/ { print $2 }' $specpath`
      Version=`awk '/Version:/ { print $2 }' $specpath`
      Release=`awk '/Release:/ { print $2 }' $specpath`
      Summary=` grep "Summary:" $specpath | sed 's/Summary:[ ]*//' | sed 's/+/ /g'`
      Vendor=` grep "Vendor:" $specpath | sed 's/Vendor:[ ]*//' | sed 's/+/ /g'`

      Group=`awk '/Group:/ { print $2 }' $specpath`

      saveIFS=$IFS
      state=1
      while IFS= read -r var
      do
        if [[ $state -eq 1 ]] ; then
          length=`expr match "$var" '%Description'`
          if [[ $length -eq 12 ]] ; then
            state=2
          fi
        elif [[ $state -eq 2 ]] ; then
          #
          # Look to see if the first character of the line starts with a '%'
          #
          if [[ ${var:0:1} == "%" ]] ; then
            state=3
          else
            Description=`printf "%s\n%s" "$Description" "$var"`
          fi
        fi
      done < "$specpath"
      IFS=$saveIFS

      #
      # Read the rpm-spec.txt file line by line
      # until I find a line starting with %Description
      # then save this line id $Description.
      # read in line by line
      #   if line doesn't start with '%' then
      #     add this to $Description
      #   end if
      #
    fi
    show_spec_form $application "1 Create"
  fi

  if [[ $step -eq 2 ]] ; then
    step_3
  fi

  if [[ $step -eq 4 ]] ; then
    step_4
  fi

  cat << EOF
EOF
