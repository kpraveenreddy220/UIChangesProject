!/bin/bash

LOG=/tmp/sdk.log
#
# NAME
#	installationcreator/index.cgi
#
# SYNOPSIS
#	installationcreator[?application=APP_NAME&step=x&Version=...]
#
# DESCRIPTION
#	This function is used to allow a VAR to generate an RPM file from the list
#	of files within an application's /home directory.
#
# RETURNS
#	A .rpm file
#
# VERSION
#	1.0	2017-03-08	Draft version.
#	1.1	2017-03-13	Create /home/sdk/files/applications directory if it does
#				already exist.
#	1.2	2017-03-14	Create the spec file in SPECS subdirectory.
#	1.3	2017-03-21	Create soft links in /var/run/www/html and /var/run/www/cgi-bin
#				to the new application.
#	1.4	2017-03-23	Remove the soft links as the platform team state that they will
#				make the links when the application is installed.
#				Change the fles to be relocatable.
#	1.5	2017-04-18	Added %exclude to not include .ash_history or .ssh/ in the generated RPM
#
#	1.6	2017-04-21	Changed version number to include build number as part
#				of the version.  xx.yy.zz
#
#	1.7	2017-04-25	Move the temporary BUILD RPMS and SPECS directories to be under
#				/home/sdk/files/tmp/$application to avoid polluting the more
#				permanent /home/sdk/files/applications directory.
#
#				Also call generate link to the saveAs.cgi to force the "Save as"
#				dialog
#				
#	1.8	2017-05-17	Removed the depricated rpm tag BUILDROOT and added debugging
#				message showing the rpmbuild command line.
BuildArch="NoArch"

#
# NAME
#	show_first_page
#
# SYNOPSIS
#	http://ip_address/html/sdk/installationcreator
#
# DESCRIPTION
#	This function displays the main (index) page for the package installation creator tool
#	It asks the user to select one of the available applications.
#
# RETURNS
#	if the user selects an application then
#
show_first_page() {
  cat << EOF
The Luxe terminal uses the <a href='https://en.wikipedia.org/wiki/RPM_Package_Manager'>RPM Package Manager</a>
to generate and install packages of software.
<p>
The following is from the Linux Documentation Project RPM HOWTO.  
<p>
<h2>RPM In a Nutshell</h2>
Much like a compressed tarball, RPM uses a combination of rolling together multiple files into one
archive and compression of this archive to build the bulk of the RPM package. Furthermore,
additional header information is inserted. This includes pre- and post-installation scripts
to prepare the system for the new package, as well as information for the database that RPM
maintains. Dependencies are checked before any installation occurs, and if the appropriate
flags are set for the installation they are also installed.
<p>
It is this database that makes RPM work the magic that it does. Stored in there are all of
the properties of the installed packages. Should this become corrupted, it can be rebuilt
using the rpm tool. 
<p>
<a href='http://www.tldp.org/HOWTO/RPM-HOWTO/build.html'>This link is to the RPM HOWTO - 6.
Building RPM's</a><br>
From this descrition, although not complex, the Luxe SDK includes a tool that can generate a
software installation pack to
install a copy of all of the files within one application's /home directory.  To allow the
generated installation pack to be installed onto a production
terminal, the file <b><i>manifest.xml</i></b> which is part of the pack must be signed and
the signature placed into a file <b></i>manifest.xml.sig</i></b> and this file added to the 
package.
<p>
<hr>
EOF

  #
  # Show the complete list of all /home directories linked into /var/run/www/html
  #
  echo "Select which application to create a package for:<p>"
  for x in $( ls -L /home ) ; do
    if [[ "$x" != "platform" && "$x" != "default" ]] ; then
      echo " <a href='?application=$x&step=1'>$x</a><br> "
    fi
  done
  echo "<br>"

cat << EOF

<hr>
<font size='-2'>This page is installed in /home/sdk/html/installationcreator/index.cgi</font>
</body>
</html>
EOF
}


#
# NAME
#	show_spec_form
#
# SYNSOPSIS
#	show_spec_form $application "1 - Create" or "2 - Verify"
#
# DESCRIPTION
#	This function shows the HTML input form that allows the user to
#	enter or modify the form fields that describe the application.
#
# RETURNS
#
show_spec_form() {
  Summary=${Summary//+/ }
  Vendor=${Vendor//+/ }
  cat << EOF
  <h3>Step $2 SPEC File</h3>
  The three directives, <b><i>Name</i></b>, <b><i>Version</i></b>, and <b><i>Release </i></b>
  are used to create the RPM package's filename.<br>
  RPM filenames are in Name-Version-Release format.
  <form action="">
    <table>
      <tr>
        <th align='left' bgcolor='lightgrey'>Field Name</th>
        <th align='left' bgcolor='lightgrey'>Value</th>
        <th align='left' bgcolor='lightgrey'>Description</th>
      </tr>
      <tr>
        <td>Name: </td>
        <td><input type="text" name="Name" value="$application" readonly ></td>
        <td>The name of the package.</td>
      </tr>
      <tr>
        <td>Version: </td>
        <td><input type="text" name="Version" value="$Version"></td>
        <td>major.minor.build version, such as 1.2.1</td>
      </tr>
      <tr>
        <td>Release: </td>
        <td><input type="text" name="Release" value="$Release"></td>
        <td>Release number, such as 5</td>
      </tr>
      <tr>
        <td>Summary: </td>
        <td><input type="text" name="Summary" value="$Summary"></td>
        <td>One line description of application $application</td>
      </tr>
      <tr>
        <td>Description: </td>
        <td><textarea name="Description">$Description</textarea></td>
        <td>A multi-line description</td>
      </tr>
      <tr>
        <td>Vendor:</td>
        <td><input type="text" name="Vendor" value="$Vendor"></td>
        <td>Name of your company</td>
      </tr>
    </table>
    <br>
    <input type="text" name="Group" value="LuxeApp" hidden>
    <input type="text" name="application" value="$1" hidden>
    <input type="text" name="step" value="2" hidden>
    <input type="submit" value="Create RPM SPEC file"> from the files in application $1
  </form>
EOF
}

#
# NAME
#	step_2_verify_spec_form
#
# SYNOPSIS
#
# DESCRIPTION
#	This function verifies that all of the required fields have been
#	entered.  If not, the entry form is redisplayed.
#
# RETURNS
#
step_2_verify_spec_form() {
    step=3
    #
    # Verify the parameters.
    # If there are any problems then
    #   show list of errors followed by the spec form via step_1
    # end if
    #
    for parameterName in Name Version Release Summary Description Group Vendor application ; do
      eval parameter=\$$parameterName
      if [[ "$parameter" == "" ]] ; then
        echo "<font color='red'>Mandatory field $parameterName is missing</font><br>"
        step=1
      fi
    done
    #
    # If there are errors, (step==1) then 
    #   redisplay the entry form
    # end if
    #   
    if [[ $step -eq 1 ]] ; then
      show_spec_form $application "2 - Verify"
    fi
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

  echo "<h3>Step 3 - SPEC file</h3>"
  echo "Please review the generated rpmbuild SPEC file information below:"
  echo "<p>"
  echo "<pre>"

#  SPEC_TEMP=/tmp/rpm-spec.txt
  SPEC_DIR=$topdir/SPECS
  SPEC_FILE=$SPEC_DIR/$application-$Version-$Release.spec

  cat << EOF >$SPEC_FILE
%define _topdir       /home/sdk/files/tmp/$application
%define _builddir     %{_topdir}/BUILD
%define _rpmdir       %{_topdir}/RPMS
%define _sourcedir    %{_topdir}/SOURCES
%define _specdir      %{_topdir}/SPECS
%define _srcrpmdir    %{_topdir}/SRPMS
 
Name:        $application
Version:     $Version
Release:     $Release
Group:       $Group
License:     Proprietary
Vendor:      $Vendor
Summary:     $Summary
AutoReqProv: no
BuildArch:   $BuildArch
#Source:      $topdir
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

  #copy app files to rpm work area (preserve permissions)
  cp -a /home/$application /home/sdk/files/tmp/$application/app-files/home/

  #
  # Put two clickable buttons.  One to accept and one to return
  #
  cat << EOF
<hr>
<form action="">
  <input type="text" name="application" value="$application" hidden>
  <input type="text" name="specpath" value="$SPEC_DIR/$SPEC_file" hidden>
  <input type="text" name="step" value="4" hidden>
  <input type="text" name="Version" value="$Version" hidden>
  <input type="text" name="Release" value="$Release" hidden>
  <input type="text" name="Vendor" value="$Vendor" hidden>
  <input type="submit" name="selection" value="Create RPM"> or <input type="submit" name="selection" value="Go back">
</form>
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
  echo "<h3>Step 4 RPM File</h3>"

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
  rpmbuild -bb $BUILD_ROOT/SPECS/$NVR.spec --buildroot /home/sdk/files/tmp/$application/app-files/ >/dev/null 2>&1

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
    echo "<!-- Command was rpmbuild -bb $BUILD_ROOT/SPECS/$NVR.spec --buildroot /home/sdk/files/tmp/$application/app-files/ -->"
  else
    echo "<b>ERROR</b>"
    echo "Build error, $RPMS_FILE file was not generated<br>"
    echo "Running command from directory <b><i>$BUILD_ROOT/SPECS</i></b><br>"
    echo "Command was <b><i>rpmbuild -bb $BUILD_ROOT/SPECS/$NVR.spec --buildroot /home/sdk/files/tmp/$application/app-files/</i></b><br>"
  fi
cat << EOF
  <form action=''>
    <input type="text" name="step" value="4" hidden>
    <input type="submit" name="selection" value="Go back">
  </form>
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

<!DOCTYPE HTML>
<html>
<head>
  <META NAME="Author" CONTENT="Steve Newall">
  <META NAME="Generator" CONTENT="vi (because real programmers use real editors)">
   <link rel="stylesheet" type="text/css" href="/html/sdk/assets/css/styles.css">
    <link  rel="stylesheet" href="/html/sdk/components/bootstrap-3.3.7/css/bootstrap.min.css">

    <script type="text/javascript" src="/html/sdk/components/jquery-2.2.4/jquery.js"></script>
    <script type="text/javascript" src="/html/sdk/components/bootstrap-3.3.7/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="/html/sdk/components/mustache-2.3.0/mustache.min.js"></script>

    <script type="text/javascript" src="/html/sdk/assets/js/app.js"></script>
  <style>                                                                      
    table, th, td {                                                            
      border: 1px solid black;                                                 
      border-collapse: collapse;                                               
      padding: 10px;                                                           
    }                                                                          
    th {                                                                       
      height: 20px;                                                            
      vertical-align: middle;                                                  
    }                                                                          
  </style>                                                                     

</head>

<body>
  <div style='position: relative;'>
    <img src='/html/sdk/assets/images/bar.png' style='width: 100%; height: 30px;'>
    <div style='position: absolute; top: 4px; left: 4px;'>
      <img src='/html/sdk/assets/images/logo.png'>
    </div>
    <div style='position: absolute; top: 0px; left: 170px; font-family: sans-serif; font-size: 26px; font-weight: bold; color: white;'>
      <a href='/html/sdk' class='a_plain'>Luxe SDK</a> - 
      <a href='/html/sdk/installationcreator' class='a_plain'>Software Package Installation Creator Tool</a>
    </div>
<p>
  <h1>Luxe Software Package Installation Creator</h1>
EOF

  #
  # If the parameter "application" is not available, then display the main page
  # and ask the user to select the application name
  #
  if [[ "$application" == "" ]] ; then
    show_first_page
    exit
  fi

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
      echo "rpm-spec.txt exists, read in the default values"
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
    step_2_verify_spec_form
  fi

  if [[ $step -eq 3 ]] ; then
    step_3

  fi

  if [[ $step -eq 4 ]] ; then
    step_4
  fi

  cat << EOF
<hr>
<font size='-2'>This page is installed in /home/sdk/html/installationcreator/index.cgi</font>
</body>
</html>
EOF
