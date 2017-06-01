import merge from "merge2";
import gulp from "gulp";
import ts from "gulp-typescript";

gulp.task("build", function() {
  const tsProject = ts.createProject("./tsconfig.json");
  const tsResult = tsProject.src().pipe(tsProject());
  return merge([
    tsResult.dts.pipe(gulp.dest("lib")),
    tsResult.js.pipe(gulp.dest("lib"))
  ]);
});
