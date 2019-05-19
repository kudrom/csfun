import time
import os
import argparse
import json
import requests
from rarfile import RarFile
from threading import Thread

DEBUG = True


def download_demo(demo, event_folder):
    print('Downloading %s' % demo['url'])
    with requests.get(demo['url'], allow_redirects=not DEBUG,
                      headers={'User-Agent': 'joder'},
                      stream=True) as r:
        r.raise_for_status()
        if DEBUG:
            print(r.headers['Location'])
        else:
            local_filename = os.path.join(
                event_folder, 'rars', r.url.split('/')[-1])
            with open(local_filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                print('Downloaded %s' % local_filename)

            rar = RarFile(local_filename)
            rar.extractall(event_folder)
            for filename in rar.namelist():
                old = os.path.join(event_folder, filename)
                new = os.path.join(event_folder,
                                   str(demo['date']) + '#' + filename)
                os.rename(old, new)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Download demo files described on a json-per-line file')
    parser.add_argument('description_file',
                        help='File that describes the demos to download')
    parser.add_argument('--destination_folder', default='.',
                        help='Where to put the downloaded demos')
    parser.add_argument('--threads', type=int, default=1,
                        help='Number of threads to download concurrently')
    args = parser.parse_args()

    events = {}
    with open(args.description_file, 'r') as fp:
        for line in fp.readlines():
            demo = json.loads(line)
            if demo['event'] not in events:
                events[demo['event']] = []
            events[demo['event']].append({
                'url': demo['url'],
                'date': demo['date']
            })

    for event, demos in events.items():
        event_folder = os.path.join(args.destination_folder,
                                    event.replace(' ', '_'))
        if not os.path.isdir(event_folder):
            os.mkdir(event_folder)
            os.mkdir(os.path.join(event_folder, 'rars'))

        threads = []
        for demo in demos:
            threads.append(Thread(target=download_demo,
                                  args=(demo, event_folder)))
            threads[-1].start()
            while len(threads) >= args.threads:
                threads.pop().join()

        for thread in threads:
            thread.join()
