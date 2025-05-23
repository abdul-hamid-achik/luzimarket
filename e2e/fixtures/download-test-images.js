const fs = require('fs');
const https = require('https');
const path = require('path');

// Sample images from Unsplash with different categories for testing
const testImages = [
    {
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop&crop=center',
        filename: 'test-product-1.jpg',
        description: 'Watch product image'
    },
    {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop&crop=center',
        filename: 'test-product-2.jpg',
        description: 'Shoe product image'
    },
    {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&crop=center',
        filename: 'test-product-3.jpg',
        description: 'Headphones product image'
    },
    {
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center',
        filename: 'test-product-large.jpg',
        description: 'Larger camera image for size testing'
    },
    {
        url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=150&fit=crop&crop=center',
        filename: 'test-product-small.jpg',
        description: 'Small sunglasses image'
    }
];

function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, filename);
        const file = fs.createWriteStream(filePath);

        console.log(`📸 Downloading ${filename}...`);

        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`✅ Downloaded ${filename} successfully`);
                resolve(filename);
            });

            file.on('error', (err) => {
                fs.unlink(filePath, () => { }); // Delete the file on error
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function downloadTestImages() {
    console.log('🖼️  Downloading test images from Unsplash...');
    console.log('📁 Saving to:', __dirname);

    try {
        for (const image of testImages) {
            await downloadImage(image.url, image.filename);
            // Small delay to be respectful to Unsplash
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n🎉 All test images downloaded successfully!');
        console.log('📋 Images available for e2e testing:');
        testImages.forEach(img => {
            console.log(`   • ${img.filename} - ${img.description}`);
        });

        // Create a main test-image.jpg symlink/copy for the basic tests
        const mainTestImage = path.join(__dirname, 'test-image.jpg');
        const sourceImage = path.join(__dirname, testImages[0].filename);

        try {
            if (fs.existsSync(mainTestImage)) {
                fs.unlinkSync(mainTestImage);
            }
            fs.copyFileSync(sourceImage, mainTestImage);
            console.log('\n✅ Created main test-image.jpg for basic e2e tests');
        } catch (err) {
            console.log('⚠️  Could not create main test-image.jpg:', err.message);
        }

    } catch (error) {
        console.error('❌ Error downloading images:', error.message);
        process.exit(1);
    }
}

// Run the download if this script is executed directly
if (require.main === module) {
    downloadTestImages();
}

module.exports = { downloadTestImages, testImages }; 