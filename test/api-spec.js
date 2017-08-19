'use strict'
const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const rimraf = require('rimraf')

const ashar = require('..')
const compDirs = require('./util/compareDirectories')
const compFiles = require('./util/compareFiles')
const transform = require('./util/transformStream')

describe('api', function () {
  beforeEach(function () {
    rimraf.sync(path.join(__dirname, '..', 'tmp'))
  })
  it('should create archive from directory', function (done) {
    ashar.createPackage('test/input/packthis/', 'tmp/packthis-api.ashar', function (error) {
      if (error != null) return done(error)
      done(compFiles('tmp/packthis-api.ashar', 'test/expected/packthis.ashar'))
    })
  })
  it('should create archive from directory (without hidden files)', function (done) {
    ashar.createPackageWithOptions('test/input/packthis/', 'tmp/packthis-without-hidden-api.ashar', {dot: false}, function (error) {
      if (error != null) return done(error)
      done(compFiles('tmp/packthis-without-hidden-api.ashar', 'test/expected/packthis-without-hidden.ashar'))
    })
  })
  it('should create archive from directory (with transformed files)', function (done) {
    ashar.createPackageWithOptions('test/input/packthis/', 'tmp/packthis-api-transformed.ashar', {transform}, function (error) {
      if (error != null) return done(error)
      done(compFiles('tmp/packthis-api-transformed.ashar', 'test/expected/packthis-transformed.ashar'))
    })
  })
  it('should list files/dirs in archive', function () {
    const actual = ashar.listPackage('test/input/extractthis.ashar').join('\n')
    let expected = fs.readFileSync('test/expected/extractthis-filelist.txt', 'utf8')
    // on windows replace slashes with backslashes and crlf with lf
    if (os.platform() === 'win32') {
      expected = expected.replace(/\//g, '\\').replace(/\r\n/g, '\n')
    }
    return assert.equal(actual, expected)
  })
  it('should extract a text file from archive', function () {
    const actual = ashar.extractFile('test/input/extractthis.ashar', 'dir1/file1.txt').toString('utf8')
    let expected = fs.readFileSync('test/expected/extractthis/dir1/file1.txt', 'utf8')
    // on windows replace crlf with lf
    if (os.platform() === 'win32') {
      expected = expected.replace(/\r\n/g, '\n')
    }
    return assert.equal(actual, expected)
  })
  it('should extract a binary file from archive', function () {
    const actual = ashar.extractFile('test/input/extractthis.ashar', 'dir2/file2.png')
    const expected = fs.readFileSync('test/expected/extractthis/dir2/file2.png', 'utf8')
    return assert.equal(actual, expected)
  })
  it('should extract a binary file from archive with unpacked files', function () {
    const actual = ashar.extractFile('test/input/extractthis-unpack.ashar', 'dir2/file2.png')
    const expected = fs.readFileSync('test/expected/extractthis/dir2/file2.png', 'utf8')
    return assert.equal(actual, expected)
  })
  it('should extract an archive', function (done) {
    ashar.extractAll('test/input/extractthis.ashar', 'tmp/extractthis-api/')
    compDirs('tmp/extractthis-api/', 'test/expected/extractthis', done)
  })
  it('should extract an archive with unpacked files', function (done) {
    ashar.extractAll('test/input/extractthis-unpack.ashar', 'tmp/extractthis-unpack-api/')
    compDirs('tmp/extractthis-unpack-api/', 'test/expected/extractthis', done)
  })
  it('should extract a binary file from archive with unpacked files', function () {
    const actual = ashar.extractFile('test/input/extractthis-unpack-dir.ashar', 'dir1/file1.txt')
    const expected = fs.readFileSync('test/expected/extractthis/dir1/file1.txt', 'utf8')
    return assert.equal(actual, expected)
  })
  it('should extract an archive with unpacked dirs', function (done) {
    ashar.extractAll('test/input/extractthis-unpack-dir.ashar', 'tmp/extractthis-unpack-dir-api/')
    compDirs('tmp/extractthis-unpack-dir-api/', 'test/expected/extractthis', done)
  })
  it('should handle multibyte characters in paths', function (done) {
    ashar.createPackage('test/input/packthis-unicode-path/', 'tmp/packthis-unicode-path.ashar', function (error) {
      if (error != null) return done(error)
      done(compFiles('tmp/packthis-unicode-path.ashar', 'test/expected/packthis-unicode-path.ashar'))
    })
  })
  it('should extract a text file from archive with multibyte characters in path', function () {
    const actual = ashar.extractFile('test/expected/packthis-unicode-path.ashar', 'dir1/女の子.txt').toString('utf8')
    let expected = fs.readFileSync('test/input/packthis-unicode-path/dir1/女の子.txt', 'utf8')
    // on windows replace crlf with lf
    if (os.platform() === 'win32') {
      expected = expected.replace(/\r\n/g, '\n')
    }
    return assert.equal(actual, expected)
  })
})
