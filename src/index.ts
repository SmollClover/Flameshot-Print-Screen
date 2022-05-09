import consola from 'consola';
import isPNG from 'is-png';

process.stdin.on('data', (data) => {
	if (isPNG(data)) {
        return consola.log(true);
    } else {
        return data.toString()
    }
});
