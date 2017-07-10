#include <stdio.h> /* printf, sprintf */
#include <stdlib.h> /* exit */
#include <unistd.h> /* read, write, close */
#include <string.h> /* memcpy, memset */
#include <sys/socket.h> /* socket, connect */
#include <netinet/in.h> /* struct sockaddr_in, struct sockaddr */
#include <netdb.h> /* struct hostent, gethostbyname */
#include <error.h>

/*
 * NAME
 *	hello
 *
 * SYNOPSIS
 *	/home/viking/bin/hello
 *
 * DESCRIPTION
 *	This program is a very simple test to display a "Hello, world!" message
 *	on the the Luxe 8000i display by calling two HTTP API functions.
 *
 *	The first call is to tell the terminal to show a simple HTML page on
 *	the display that consists of a background image and a single list
 *	box that can accept a text string:-
 *		http://127.0.0.1/cgi-bin/page/show?path=viking/hello.html
 *
 *	The second call is to send a text string to the page's list box.
 *		http://127.0.0.1/cgi-bin/page/update
 *
 *	Messages are sent to the Luxe's web server (the http daemon) through
 *	a socket.
 *	There are many C libraries available to format and send HTTP messages
 *	to web servers, such as libcurl, libwww, neon, libsoup, etc.  Using 
 *	one of these libraries can simplify complex HTTP requests.
 *
 *
 *	The following comments and parts of the code are from Jeremy Jeremiah
 *  as posted to stackoverflow.com
 *
 *	An http message has a header part and a message body separated by a
 *	blank line. The blank line is ALWAYS needed even if there is no
 *	message body. The header starts with a command and has additional
 *	lines of key value pairs separated by a colon and a space. If there
 *	is a message body, it can be anything you want it to be.
 *
 *	Lines in the header and the blank line at the end of the header
 *	must end with a carraige return and linefeed pair (see HTTP header
 *	line break style) so that's why those lines have \r\n at the end.
 *	This is NOT the Linux end-of-line, although some (not all) web
 *	servers will tolerate the Linux end-of-line.
 *
 *	A URL has the form of http://host:post/path?query_string
 *
 *	There are two main ways of submitting a request to a website:
 *
 *	GET: The query string is optional but, if specified, must be
 *	reasonably short. Because of this the header could just be the
 *	GET command and nothing else. A sample message could be:
 *
 *	    GET /path?query_string HTTP/1.0\r\n
 *	    \r\n
 *
 *	POST: What would normally be in the query string is in the body
 *	of the message instead. Because of this the header needs to include
 *	the Content-Type: and Content-Length: attributes as well as the POST
 *	command. A sample message could be:
 *
 *	    POST /path HTTP/1.0\r\n
 *	    Content-Type: text/plain\r\n
 *	    Content-Length: 12\r\n
 *	    \r\n
 *	    query_string
 *
 *	So to send the message the C program needs to:
 *
 *	    create a socket
 *	    lookup the IP address
 *	    open the socket
 *	    send the request
 *	    wait for the response
 *	    close the socket
 *
 *	The send and receive calls won't necessarily send/receive ALL the
 *	data you give them - they will return the number of bytes actually
 *	sent/received. It is up to you to call them in a loop and
 *	send/receive the remainder of the message.
 *
 *	What I did not do in this sample is any sort of real error checking.
 *	When something fails I just exit the program.
 *
 * RETURNS
 *
 */


void httpRequestResponse( char *host, char *message, char *response, int responseMax ) {
    int sent, total, bytes, received;
    struct hostent *server;
    struct sockaddr_in serv_addr;
    int sockfd;
    int portno = 80;

    /* create the socket */
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0) error(1, 1, "ERROR opening socket");

    /* lookup the ip address */
    server = gethostbyname(host);
    if (server == NULL) error(2, 2, "ERROR, no such host");

    /* fill in the structure */
    memset(&serv_addr,0,sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(portno);
    memcpy(&serv_addr.sin_addr.s_addr,server->h_addr,server->h_length);

    /* connect the socket */
    if (connect(sockfd,(struct sockaddr *)&serv_addr,sizeof(serv_addr)) < 0)
        error(3, 3, "ERROR connecting");

    /* send the request */
    total = strlen(message);
    sent = 0;
    do {
        bytes = write(sockfd,message+sent,total-sent);
        if (bytes < 0)
            error(4, 4, "ERROR writing message to socket");
        if (bytes == 0)
            break;
        sent+=bytes;
    } while (sent < total);

    /* receive the response */
    memset(response,0,responseMax);
    total = responseMax-1;
    received = 0;
    do {
        bytes = read(sockfd,response+received,total-received);
        if (bytes < 0)
            error(5, 5, "ERROR reading response from socket");
        if (bytes == 0)
            break;
        received+=bytes;
    } while (received < total);

    if (received == total)
        error(6, 6, "ERROR storing complete response from socket");

    /* close the socket */
    close(sockfd);
}

int main(int argc, char** argv)
{

    char *messageGET = "GET /cgi-bin/page/show?path=viking/hello_world.html HTTP/1.0\r\n\r\n";

    char messagePOST[1024];

    char *messagePOSTtext = "<?xml version='1.0' ?>"
                            "<page>"
                            "  <update action='append' id='box1'>"
                            "    <text>, world!</text>"
                            "  </update>"
                            "</page>";

    char *messagePOSTfmt = "POST /cgi-bin/page/update HTTP/1.0\r\n"
                           "Content-Type: text/xml\r\n"
                           "Content-Length: %d\r\n"
                           "\r\n"
                           "%s";
    char response[4096];


    /*
     * send the first request (GET) to display the HTML page
     * and process response
     */
    httpRequestResponse( "127.0.0.1", messageGET, response, sizeof(response) );
    printf("Response:\n%s\n",response);


    /*
     * Now send the POST request to send the text to display
     * and process response
     */
    sprintf(messagePOST, messagePOSTfmt, strlen(messagePOSTtext), messagePOSTtext);
    httpRequestResponse( "127.0.0.1", messagePOST, response, sizeof(response) );
    printf("Response:\n%s\n",response);

    return 0;
}

