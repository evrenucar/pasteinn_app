import importlib.util
import pathlib
import os
import socket
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('server',pathlib.Path(os.environ.get('PASTEINN_ROOT',pathlib.Path(__file__).resolve().parent.parent))/'server.py')
server=importlib.util.module_from_spec(spec);spec.loader.exec_module(server)

class PreviewTests(unittest.TestCase):
    def test_private_and_mixed_dns_are_blocked(self):
        for ips in [('127.0.0.1',),('10.0.0.1',),('169.254.169.254',),('::1',),('93.184.216.34','192.168.1.1')]:
            addresses=[(socket.AF_INET,socket.SOCK_STREAM,6,'',(ip,443)) for ip in ips]
            with patch.object(socket,'getaddrinfo',return_value=addresses):
                with self.assertRaises(ValueError):server.public_target('https://test.example/')

    def test_protocol_credentials_and_ports(self):
        for url in ['file:///etc/passwd','http://user:secret@example.com','https://example.com:8080','https://example.com/\r\nX:1']:
            with self.assertRaises(ValueError):server.public_target(url)

    def test_public_destination_pinned(self):
        with patch.object(socket,'getaddrinfo',return_value=[(socket.AF_INET,socket.SOCK_STREAM,6,'',('93.184.216.34',443))]):
            _,host,port,address=server.public_target('https://example.com/a')
            self.assertEqual((host,port,address),('example.com',443,'93.184.216.34'))

    def test_metadata_is_text_not_markup(self):
        parser=server.Metadata();parser.feed('<title>A &amp; B</title><meta property="og:title" content="&lt;script&gt;test&lt;/script&gt;"><meta name="description" content="A description">')
        self.assertEqual(parser.title,'A & B');self.assertEqual(parser.meta['og:title'],'<script>test</script>')

if __name__=='__main__':unittest.main()
