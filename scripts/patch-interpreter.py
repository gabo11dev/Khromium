#!/usr/bin/env python3
"""Change an ELF32 interpreter in place, using only its existing string space."""
from pathlib import Path
import struct
import sys

def patch(path, interpreter='/mnt/us/cr156ld.so'):
    path=Path(path)
    data=bytearray(path.read_bytes())
    if data[:6]!=b'\x7fELF\x01\x01':
        raise ValueError('Expected a little-endian ELF32 file')
    if struct.unpack_from('<H',data,18)[0]!=40:
        raise ValueError('Expected ARM architecture')
    phoff=struct.unpack_from('<I',data,28)[0]
    entsize,count=struct.unpack_from('<HH',data,42)
    for i in range(count):
        header=struct.unpack_from('<8I',data,phoff+i*entsize)
        if header[0]==3:
            offset,size=header[1],header[4]
            old=bytes(data[offset:offset+size]).split(b'\0',1)[0].decode()
            if old not in ('/lib/ld-linux-armhf.so.3',interpreter):
                raise ValueError('Unexpected interpreter: '+old)
            replacement=interpreter.encode()+b'\0'
            if len(replacement)>size:
                raise ValueError('Replacement does not fit existing ELF segment')
            data[offset:offset+size]=replacement.ljust(size,b'\0')
            path.write_bytes(data)
            return old
    raise ValueError('No interpreter segment found')

if __name__=='__main__':
    print(patch(sys.argv[1]))
