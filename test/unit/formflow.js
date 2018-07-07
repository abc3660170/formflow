$(function () {
    QUnit.test('it works', function (assert) {
        $("body").append("<div id='chentao'>chentao</div>")
        assert.strictEqual($("#chentao").size(), 1)
    })
})