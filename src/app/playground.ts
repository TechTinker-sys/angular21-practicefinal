import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Child } from './child';
import { Card } from './card';

@Component({
  selector: 'app-playground',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Child, Card, ReactiveFormsModule],
  templateUrl: './playground.html'
})
export class Playground {
  // ---------- Counter ----------
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.set(this.count() + 1);
  }

  childMessage = signal('');

  handleChildClick(msg: string) {
    this.childMessage.set(msg);
  }

  // ---------- Reactive Form ----------
  myForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email])
  });

  formSubmitMessage = signal('');

  submitForm() {
    if (this.myForm.valid) {
      this.formSubmitMessage.set('Form submitted successfully.');
      // clear after a short delay
      setTimeout(() => this.formSubmitMessage.set(''), 3000);
    } else {
      this.formSubmitMessage.set('Please complete the required fields.');
      setTimeout(() => this.formSubmitMessage.set(''), 3000);
    }
    console.log(this.myForm.value);
  }

  // ---------- RxJS Search ----------
  searchResult = signal('');
  private searchSubject = new Subject<string>();

  constructor(private http: HttpClient) {
    this.searchSubject.pipe(debounceTime(500)).subscribe((value) => {
      this.searchResult.set('You searched: ' + value);
    });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  // ---------- HttpClient Users ----------
  users = signal<any[]>([]);
  usersLoading = signal(false);

  loadUsers() {
    this.usersLoading.set(true);
    this.http.get<any[]>('https://jsonplaceholder.typicode.com/users').subscribe({
      next: (data) => {
        this.users.set(data);
        this.showToast('Users loaded successfully.');
      },
      error: () => this.showToast('Unable to load users.'),
      complete: () => this.usersLoading.set(false)
    });
  }

  // ---------- CRUD for Posts ----------
  posts = signal<any[]>([]);
  postsLoading = signal(false);
  toast = signal('');
  private toastTimeout?: number;

  postForm = new FormGroup({
    title: new FormControl('', Validators.required),
    body: new FormControl('', Validators.required)
  });

  editingPostId = signal<number | null>(null);

  loadPosts() {
    this.postsLoading.set(true);
    this.http.get<any[]>('https://jsonplaceholder.typicode.com/posts').subscribe({
      next: (data) => {
        this.posts.set(data.slice(0, 10)); // just first 10 for practice
        this.showToast('Posts loaded successfully.');
      },
      error: () => this.showToast('Unable to load posts.'),
      complete: () => this.postsLoading.set(false)
    });
  }

  createPost() {
    const newPost = this.postForm.value;
    this.http.post<any>('https://jsonplaceholder.typicode.com/posts', newPost).subscribe({
      next: (created) => {
        // API doesn't really save it, so we add it manually to our list
        this.posts.set([created, ...this.posts()]);
        this.postForm.reset();
        this.showToast('Post created successfully.');
      },
      error: () => this.showToast('Failed to create post.')
    });
  }

  startEdit(post: any) {
    this.editingPostId.set(post.id);
    this.postForm.setValue({ title: post.title, body: post.body });
  }

  updatePost() {
    const id = this.editingPostId();
    if (!id) return;

    const updatedPost = this.postForm.value;
    this.http.put<any>(`https://jsonplaceholder.typicode.com/posts/${id}`, updatedPost).subscribe({
      next: () => {
        // Update our local list manually since API is fake
        this.posts.set(this.posts().map((p) => (p.id === id ? { ...p, ...updatedPost } : p)));
        this.editingPostId.set(null);
        this.postForm.reset();
        this.showToast('Post updated successfully.');
      },
      error: () => this.showToast('Failed to update post.')
    });
  }

  deletePost(id: number) {
    // Confirm before deleting for UX safety
    const ok = window.confirm('Are you sure you want to delete this post?');
    if (!ok) return;

    this.http.delete(`https://jsonplaceholder.typicode.com/posts/${id}`).subscribe({
      next: () => {
        this.posts.set(this.posts().filter((p) => p.id !== id));
        this.showToast('Post deleted successfully.');
      },
      error: () => this.showToast('Failed to delete post.')
    });
  }

  cancelEdit() {
    this.editingPostId.set(null);
    this.postForm.reset();
  }

  private showToast(message: string) {
    this.toast.set(message);
    if (this.toastTimeout) {
      window.clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = window.setTimeout(() => this.toast.set(''), 3200);
  }
}
